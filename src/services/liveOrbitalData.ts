const CACHE_KEY = "spaceTrackSatcatCacheV1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedEnvelope = {
  timestamp: number;
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

function writeCache(data: LiveOrbitalData) {
  const payload: CachedEnvelope = {
    timestamp: Date.now(),
    data,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

async function fetchLiveMetrics(): Promise<LiveOrbitalData> {
  const response = await fetch("/api/spacetrack/satcat");
  if (!response.ok) {
    throw new Error(`Space-Track request failed with status ${response.status}`);
  }

  const metrics = (await response.json()) as LiveOrbitalData;
  if (!metrics || typeof metrics.totalTracked !== "number") {
    throw new Error("Space-Track returned an invalid payload.");
  }

  return metrics;
}

async function fetchAndCacheLiveMetrics(): Promise<LiveOrbitalResponse> {
  try {
    const metrics = await fetchLiveMetrics();
    writeCache(metrics);

    return {
      data: metrics,
      isFresh: true,
      fromCache: false,
      lastUpdatedAt: Date.now(),
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
      lastUpdatedAt: cached.timestamp,
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
      lastUpdatedAt: cached.timestamp,
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

export async function forceRefreshLiveOrbitalEnvironment(): Promise<LiveOrbitalResponse> {
  return fetchAndCacheLiveMetrics();
}

