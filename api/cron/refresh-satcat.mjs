// api/cron/refresh-satcat.mjs
// Vercel Cron Job handler — runs once daily at 18:12 UTC.
// This is the ONLY place in the codebase that queries Space-Track's SATCAT endpoint.
// User-facing /api/spacetrack reads the result from Redis; it never calls Space-Track.
//
// Schedule: "12 18 * * *" (18:12 UTC, after 18th SDS ~17:00 daily SATCAT update)
// Offset from top-of-hour per Space-Track's explicit request (avoid busy windows).

import { withRedis } from "../_redisClient.mjs";
import {
  getValidSessionCookie,
  invalidateSessionCookie,
} from "./_spacetrackAuth.mjs";

const SATCAT_BASE_URL =
  "https://www.space-track.org/basicspacedata/query/class/satcat";
const PREDICATES = "OBJECT_TYPE,LAUNCH,CURRENT,DECAY,FILE";

// ─── Auth check ───────────────────────────────────────────────────────────────

function isAuthorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[refresh-satcat] CRON_SECRET is not set — rejecting all requests.");
    return false;
  }
  const authHeader = req.headers["authorization"] ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

async function logExecution({ success, error, metrics }) {
  await withRedis(async (c) => {
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      success,
      error,
      totalTracked: metrics?.totalTracked ?? null,
    });
    await c.lPush("satcat:executionLog", logEntry);
    await c.lTrim("satcat:executionLog", 0, 19);
  });
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

function buildMetrics(records) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const inOrbit = Array.isArray(records)
    ? records.filter((r) => !r?.DECAY || r.DECAY.trim() === "")
    : [];

  const totalTracked = inOrbit.length;

  const addedLast30Days = inOrbit.filter((r) => {
    if (!r?.LAUNCH) return false;
    const launchTime = Date.parse(r.LAUNCH);
    return Number.isFinite(launchTime) && launchTime >= thirtyDaysAgo;
  }).length;

  const debrisCount = inOrbit.filter(
    (r) => (r?.OBJECT_TYPE || "").toUpperCase() === "DEBRIS",
  ).length;

  const activeSatellites = inOrbit.filter(
    (r) => (r?.OBJECT_TYPE || "").toUpperCase() === "PAYLOAD",
  ).length;

  const debrisToActiveRatio =
    activeSatellites > 0
      ? `${Math.max(1, Math.round(debrisCount / activeSatellites))}:1` 
      : "N/A";

  let maxFileNumber = null;
  if (Array.isArray(records)) {
    for (const r of records) {
      const fileNum = Number(r?.FILE);
      if (Number.isFinite(fileNum) && (maxFileNumber === null || fileNum > maxFileNumber)) {
        maxFileNumber = fileNum;
      }
    }
  }

  return {
    metrics: {
      totalTracked,
      addedLast30Days,
      debrisToActiveRatio,
      highestRiskShell: "LEO 800–1000km",
    },
    maxFileNumber,
  };
}

// ─── Space-Track query ────────────────────────────────────────────────────────

async function fetchSatcatRecords(cookieHeader, fileNumber) {
  let queryUrl;
  if (fileNumber) {
    // Incremental: only objects updated since the last known file number
    queryUrl = `${SATCAT_BASE_URL}/FILE/>${fileNumber}/predicates/${PREDICATES}/format/json`;
    console.log(`[refresh-satcat] Incremental fetch — file > ${fileNumber}`);
  } else {
    // First run: full snapshot
    queryUrl = `${SATCAT_BASE_URL}/predicates/${PREDICATES}/format/json`;
    console.log("[refresh-satcat] Full fetch — first run (no stored file number).");
  }

  const dataResponse = await fetch(queryUrl, {
    headers: { Cookie: cookieHeader },
  });

  if (dataResponse.status === 401 || dataResponse.status === 403) {
    throw new Error("Space-Track session expired.");
  }

  if (!dataResponse.ok) {
    throw new Error(`Space-Track SATCAT query failed: HTTP ${dataResponse.status}`);
  }

  return dataResponse.json();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  let success = false;
  let error = null;
  let metrics;
  try {
    if (!isAuthorized(req)) {
      error = "Unauthorized — invalid or missing CRON_SECRET.";
      return res.status(401).json({ error: "Unauthorized — invalid or missing CRON_SECRET." });
    }

    console.log("[refresh-satcat] Starting SATCAT refresh...");
    const startedAt = Date.now();

    // 1. Read last-used file number from Redis
    const storedFileNumber = await withRedis((c) => c.get("satcat:fileNumber"));
    const fileNumber = storedFileNumber ? Number(storedFileNumber) : null;

    // 2. Get a fresh (or cached) session cookie
    let cookieHeader = await getValidSessionCookie();

    // 3. Query Space-Track (with one retry on session expiry)
    let records;
    try {
      records = await fetchSatcatRecords(cookieHeader, fileNumber);
    } catch (err) {
      if (err instanceof Error && err.message === "Space-Track session expired.") {
        console.warn("[refresh-satcat] Session expired, re-authenticating...");
        invalidateSessionCookie();
        cookieHeader = await getValidSessionCookie();
        records = await fetchSatcatRecords(cookieHeader, fileNumber);
      } else {
        throw err;
      }
    }

    if (!Array.isArray(records) || records.length === 0) {
      console.log(
        "[refresh-satcat] Space-Track returned 0 records — no update needed (no new SATCAT entries since last run).",
      );
      success = true;
      return res.status(200).json({
        ok: true,
        message: "No new SATCAT records since last run.",
        durationMs: Date.now() - startedAt,
      });
    }

    console.log(`[refresh-satcat] Fetched ${records.length} records.`);

    // 4. Compute metrics and determine new max file number
    const computed = buildMetrics(records);
    metrics = computed.metrics;
    const { maxFileNumber } = computed;

    // 5. Persist to Redis
    await withRedis(async (c) => {
      const pipeline = c.multi();
      pipeline.set("satcat:latest", JSON.stringify(metrics));
      pipeline.set("satcat:lastUpdatedAt", new Date().toISOString());
      if (maxFileNumber !== null) {
        pipeline.set("satcat:fileNumber", String(maxFileNumber));
      }
      await pipeline.exec();
    });

    const durationMs = Date.now() - startedAt;
    console.log(
      `[refresh-satcat] Done. totalTracked=${metrics.totalTracked}, ` +
        `addedLast30Days=${metrics.addedLast30Days}, maxFileNumber=${maxFileNumber}, ` +
        `durationMs=${durationMs}`,
    );

    success = true;
    return res.status(200).json({
      ok: true,
      totalTracked: metrics.totalTracked,
      addedLast30Days: metrics.addedLast30Days,
      maxFileNumber,
      durationMs,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error("[refresh-satcat] ERROR:", error);
    return res.status(500).json({ ok: false, error });
  } finally {
    try {
      await logExecution({ success, error, metrics });
    } catch (logError) {
      console.error(
        "[refresh-satcat] Failed to write execution log:",
        logError instanceof Error ? logError.message : String(logError),
      );
    }
  }
}
