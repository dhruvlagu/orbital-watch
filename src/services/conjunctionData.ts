// Conjunction Data Service
// Mirrors the pattern in liveOrbitalData.ts:
//   - fetch from /api/conjunctions
//   - 1-hour localStorage cache with timestamp
//   - graceful fallback to cached data with age label if fetch fails

const CACHE_KEY = "spaceTrackCdmCacheV1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw record shape returned by the Space-Track CDM public class */
export type RawCdmRecord = {
  CDM_ID: string;
  SAT_1_NAME: string;
  SAT_2_NAME: string;
  TCA: string; // ISO 8601 datetime string e.g. "2025-07-10T14:22:00"
  MIN_RNG: string; // metres, as string e.g. "342.5"
  PC: string; // probability of collision as string e.g. "0.0002372735"
  EMERGENCY_REPORTABLE: string; // "Y" | "N"
};

export type RiskTier = "ELEVATED" | "MONITORED" | "LOW" | "UNKNOWN";

/** Enriched record with derived fields for the UI */
export type ConjunctionEvent = {
  id: string;
  sat1Name: string;
  sat2Name: string;
  tcaMs: number; // unix ms — TCA parsed to number for countdowns
  missDistanceM: number;
  pc: number | null;
  emergencyReportable: boolean;
  riskTier: RiskTier;
  /** e.g. "1 in 4,300" */
  oddsString: string;
};

export type ConjunctionResponse = {
  events: ConjunctionEvent[];
  count: number;
  fromCache: boolean;
  isFresh: boolean;
  lastUpdatedAt: number | null;
  error?: string;
};

type CachedEnvelope = {
  timestamp: number;
  lastUpdatedAt: number | null;
  events: ConjunctionEvent[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive risk tier based on PC value */
export function deriveRiskTier(pc: number): RiskTier {
  if (pc >= 0.001) return "ELEVATED";
  if (pc >= 0.0001) return "MONITORED";
  return "LOW";
}

/**
 * Convert a raw PC probability to a plain-English "1 in N" string.
 * e.g. 0.00023 → "1 in 4,348"
 * Returns "< 1 in 1,000,000" for extremely small values.
 */
export function pcToOddsString(pc: number): string {
  if (pc <= 0) return "< 1 in 1,000,000";
  const oneIn = Math.round(1 / pc);
  return `1 in ${oneIn.toLocaleString()}`;
}

export function dedupeRawCdmRecords(records: RawCdmRecord[]): RawCdmRecord[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const sat1 = record.SAT_1_NAME.trim();
    const sat2 = record.SAT_2_NAME.trim();
    const [first, second] = sat1 < sat2 ? [sat1, sat2] : [sat2, sat1];
    const key = `${first}|${second}|${record.TCA}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseEvents(records: RawCdmRecord[]): ConjunctionEvent[] {
  return dedupeRawCdmRecords(records)
    .map((r): ConjunctionEvent | null => {
      const rawPc = (r.PC || "").trim();
      const parsedPc = rawPc === "" ? NaN : parseFloat(rawPc);
      const pc: number | null = Number.isFinite(parsedPc) ? parsedPc : null;
      const missDistanceM = parseFloat(r.MIN_RNG);
      const tcaMs = Date.parse(r.TCA);

      // Discard records with unparseable critical fields (MIN_RNG, TCA)
      if (!Number.isFinite(missDistanceM) || !Number.isFinite(tcaMs)) {
        return null;
      }

      const emergencyReportable = r.EMERGENCY_REPORTABLE === "Y";
      const riskTier: RiskTier = pc === null ? "UNKNOWN" : deriveRiskTier(pc);
      const oddsString = pc === null ? "" : pcToOddsString(pc);

      return {
        id: r.CDM_ID,
        sat1Name: r.SAT_1_NAME || "UNKNOWN",
        sat2Name: r.SAT_2_NAME || "UNKNOWN",
        tcaMs,
        missDistanceM,
        pc,
        emergencyReportable,
        riskTier,
        oddsString,
      };
    })
    .filter((e): e is ConjunctionEvent => e !== null)
    .sort((a, b) => a.tcaMs - b.tcaMs); // soonest TCA first
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function readCache(): CachedEnvelope | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEnvelope;
    if (!parsed.timestamp || !Array.isArray(parsed.events)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(events: ConjunctionEvent[], lastUpdatedAt: number | null = null) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), lastUpdatedAt, events }),
    );
  } catch {
    // localStorage may be unavailable in some environments
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAndCacheConjunctions(): Promise<ConjunctionResponse> {
  try {
    const response = await fetch("/api/spacetrack/conjunctions");
    if (response.status === 503) {
      throw new Error("Conjunction data not yet available — updated 3x daily.");
    }
    if (!response.ok) {
      throw new Error(`Conjunctions request failed with status ${response.status}`);
    }

    const body = await response.json();
    const raw = body.records as RawCdmRecord[];
    if (!Array.isArray(raw)) {
      throw new Error("Conjunctions endpoint returned an invalid payload.");
    }

    const events = parseEvents(raw);
    const lastUpdatedAt = body.lastUpdatedAt ? Date.parse(body.lastUpdatedAt) : null;
    writeCache(events, lastUpdatedAt);

    return {
      events,
      count: events.length,
      fromCache: false,
      isFresh: true,
      lastUpdatedAt,
    };
  } catch (error) {
    const cached = readCache();
    if (!cached) {
      throw error;
    }

    const ageMs = Date.now() - cached.timestamp;
    return {
      events: cached.events,
      count: cached.events.length,
      fromCache: true,
      isFresh: ageMs <= CACHE_TTL_MS,
      lastUpdatedAt: cached.lastUpdatedAt,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

/**
 * Primary export. Returns cached data immediately if available (stale-while-revalidate).
 * Fires a background refresh regardless; calls onFreshData when the fresh payload arrives.
 */
export async function fetchConjunctions(
  onFreshData?: (response: ConjunctionResponse) => void,
): Promise<ConjunctionResponse> {
  const cached = readCache();

  if (cached) {
    const ageMs = Date.now() - cached.timestamp;
    const cachedResponse: ConjunctionResponse = {
      events: cached.events,
      count: cached.events.length,
      fromCache: true,
      isFresh: ageMs <= CACHE_TTL_MS,
      lastUpdatedAt: cached.lastUpdatedAt,
    };

    // Refresh in background; surface results via callback
    void fetchAndCacheConjunctions().then((freshResponse) => {
      if (onFreshData) onFreshData(freshResponse);
    });

    return cachedResponse;
  }

  return fetchAndCacheConjunctions();
}
