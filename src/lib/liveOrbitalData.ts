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

type SatcatRecord = {
  OBJECT_TYPE?: string;
  LAUNCH?: string;
  CURRENT?: string;
  DECAY?: string | null;
};

function buildMetrics(records: SatcatRecord[]): LiveOrbitalData {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalTracked = records.length;
  const addedLast30Days = records.filter((record) => {
    if (!record.LAUNCH) return false;
    const launchTime = Date.parse(record.LAUNCH);
    return Number.isFinite(launchTime) && launchTime >= thirtyDaysAgo;
  }).length;

  const debrisCount = records.filter(
    (record) => (record.OBJECT_TYPE || "").toUpperCase() === "DEBRIS",
  ).length;
  const activeSatellites = records.filter((record) => {
    const objectType = (record.OBJECT_TYPE || "").toUpperCase();
    if (objectType !== "PAYLOAD") return false;
    const isCurrent = (record.CURRENT || "").toUpperCase() === "Y";
    const notDecayed = !record.DECAY || record.DECAY.trim() === "";
    return isCurrent || notDecayed;
  }).length;

  const debrisToActiveRatio =
    activeSatellites > 0
      ? `${Math.max(1, Math.round(debrisCount / activeSatellites))}:1`
      : "N/A";

  return {
    totalTracked,
    addedLast30Days,
    debrisToActiveRatio,
    highestRiskShell: "LEO 800–1000km",
  };
}

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

export async function fetchLiveOrbitalEnvironment(): Promise<LiveOrbitalResponse> {
  const cached = readCache();

  try {
    const response = await fetch("/api/spacetrack/satcat");
    if (!response.ok) {
      throw new Error(`Space-Track request failed with status ${response.status}`);
    }

    const rows = (await response.json()) as SatcatRecord[];
    const metrics = buildMetrics(rows);
    writeCache(metrics);

    return {
      data: metrics,
      isFresh: true,
      fromCache: false,
      lastUpdatedAt: Date.now(),
    };
  } catch (error) {
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

