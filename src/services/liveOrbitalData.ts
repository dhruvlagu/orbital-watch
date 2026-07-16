// liveOrbitalData.ts
// Reads pre-computed SATCAT metrics from /api/spacetrack/satcat, which in turn reads
// from Redis populated once daily by the api/cron/refresh-satcat scheduled job.
// This service never triggers a Space-Track query directly — all Space-Track access
// is exclusively handled server-side by the cron job.

const CACHE_KEY = "spaceTrackSatcatCacheV1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedEnvelope = {
  timestamp: number;
  lastUpdatedAt: number | null;
  data: LiveOrbitalData;
};

export type LiveOrbitalData = {
  totalTracked: number;
  addedLast30Days: number;
  debrisToActiveRatio: string;
  highestRiskShell: string;
};

export type LiveOrbitalResponse = {
  data: LiveOrbitalData;
  isFresh: boolean;
  fromCache: boolean;
  lastUpdatedAt: number | null;
  error?: string;
};

function readCache(): CachedEnvelope | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEnvelope;
    if (!parsed.timestamp || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: LiveOrbitalData, lastUpdatedAt: number | null = null) {
  const payload: CachedEnvelope = {
    timestamp: Date.now(),
    lastUpdatedAt,
    data,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

async function fetchLiveMetrics(): Promise<{ data: LiveOrbitalData; lastUpdatedAt: number | null }> {
  const response = await fetch("/api/spacetrack/satcat");

  if (response.status === 503) {
    // Data not yet available — cron hasn't run yet on this deployment.
    // Throw a typed error so the UI can show an appropriate message.
    throw new Error("Orbital data not yet available — updated daily.");
  }

  if (!response.ok) {
    throw new Error(`Orbital data request failed with status ${response.status}`);
  }

  const body = await response.json();
  const metrics = {
    totalTracked: body.totalTracked,
    addedLast30Days: body.addedLast30Days,
    debrisToActiveRatio: body.debrisToActiveRatio,
    highestRiskShell: body.highestRiskShell,
  } as LiveOrbitalData;
  
  if (!metrics || typeof metrics.totalTracked !== "number") {
    throw new Error("Orbital data endpoint returned an invalid payload.");
  }

  const lastUpdatedAt = body.lastUpdatedAt ? Date.parse(body.lastUpdatedAt) : null;
  return { data: metrics, lastUpdatedAt };
}

async function fetchAndCacheLiveMetrics(): Promise<LiveOrbitalResponse> {
  try {
    const { data: metrics, lastUpdatedAt } = await fetchLiveMetrics();
    writeCache(metrics, lastUpdatedAt);

    return {
      data: metrics,
      isFresh: true,
      fromCache: false,
      lastUpdatedAt,
    };
  } catch (error) {
    const cached = readCache();
    if (!cached) {
      throw error;
    }

    const ageMs = Date.now() - cached.timestamp;
    const isFresh = ageMs <= CACHE_TTL_MS;

    return {
      data: cached.data,
      isFresh,
      fromCache: true,
      lastUpdatedAt: cached.lastUpdatedAt,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

export async function fetchLiveOrbitalEnvironment(
  onFreshData?: (response: LiveOrbitalResponse) => void,
): Promise<LiveOrbitalResponse> {
  const cached = readCache();

  if (cached) {
    const ageMs = Date.now() - cached.timestamp;
    const response: LiveOrbitalResponse = {
      data: cached.data,
      isFresh: ageMs <= CACHE_TTL_MS,
      fromCache: true,
      lastUpdatedAt: cached.lastUpdatedAt,
    };

    void fetchAndCacheLiveMetrics().then((freshResponse) => {
      if (onFreshData) {
        onFreshData(freshResponse);
      }
    });

    return response;
  }

  return fetchAndCacheLiveMetrics();
}

/**
 * Re-reads the latest stored orbital metrics from the server (Redis-backed).
 * Does NOT trigger a Space-Track query — data is only refreshed by the daily
 * api/cron/refresh-satcat scheduled job.
 */
export async function forceRefreshLiveOrbitalEnvironment(): Promise<LiveOrbitalResponse> {
  return fetchAndCacheLiveMetrics();
}

