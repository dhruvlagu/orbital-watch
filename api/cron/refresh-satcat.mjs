// api/cron/refresh-satcat.mjs
// Vercel Cron Job handler — attempts one SATCAT refresh per UTC day at 18:12.
// This is the ONLY place in the codebase that queries Space-Track's SATCAT endpoint.
// User-facing /api/spacetrack reads the result from Redis; it never calls Space-Track.
// Refreshes use the SATCAT file delta; full fetches require explicit bootstrap opt-in.
//
// Schedule: "12 18 * * *" (18:12 UTC, after 18th SDS ~17:00 daily SATCAT update)
// Offset from top-of-hour per Space-Track's explicit request (avoid busy windows).

import { withRedis } from "../_redisClient.mjs";
import { getValidSessionCookie, logoutFromSpaceTrack } from "./_spacetrackAuth.mjs";

const SATCAT_BASE_URL =
  "https://www.space-track.org/basicspacedata/query/class/satcat";
const PREDICATES = "NORAD_CAT_ID,OBJECT_TYPE,LAUNCH,CURRENT,DECAY,FILE";

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

  const payloadCount = inOrbit.filter(
    (r) => (r?.OBJECT_TYPE || "").toUpperCase() === "PAYLOAD",
  ).length;

  const debrisToPayloadRatio =
    payloadCount > 0
      ? `${(debrisCount / payloadCount).toFixed(1)}:1`
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
      debrisToPayloadRatio,
    },
    maxFileNumber,
  };
}

function normalizeCatalogEntry(record) {
  if (!record || !record.NORAD_CAT_ID) return null;
  return {
    NORAD_CAT_ID: String(record.NORAD_CAT_ID),
    OBJECT_TYPE: record.OBJECT_TYPE || "",
    LAUNCH: record.LAUNCH || "",
    CURRENT: record.CURRENT || "",
    DECAY: record.DECAY || "",
    FILE: record.FILE || "",
  };
}

// ─── Space-Track query ────────────────────────────────────────────────────────

async function fetchSatcatRecords(cookieHeader, fileNumber) {
  const queryUrl = fileNumber === null
    ? `${SATCAT_BASE_URL}/predicates/${PREDICATES}/format/json`
    : `${SATCAT_BASE_URL}/file/>${fileNumber}/predicates/${PREDICATES}/format/json`;

  console.log(
    fileNumber === null
      ? "[refresh-satcat] Full bootstrap fetch."
      : `[refresh-satcat] Incremental fetch — file > ${fileNumber}`,
  );

  const dataResponse = await fetch(queryUrl, {
    headers: { Cookie: cookieHeader },
  });

  if (dataResponse.status === 401 || dataResponse.status === 403) {
    throw new Error(`Space-Track SATCAT query failed: HTTP ${dataResponse.status}`);
  }

  if (!dataResponse.ok) {
    throw new Error(`Space-Track SATCAT query failed: HTTP ${dataResponse.status}`);
  }

  const records = await dataResponse.json();
  if (!Array.isArray(records)) {
    throw new Error("Space-Track SATCAT query returned a non-array response.");
  }

  return records;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  let success = false;
  let error = null;
  let metrics;
  let ownsAttemptSlot = false;
  try {
    if (!isAuthorized(req)) {
      error = "Unauthorized — invalid or missing CRON_SECRET.";
      return res.status(401).json({ error: "Unauthorized — invalid or missing CRON_SECRET." });
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const attemptClaimed = await withRedis((c) =>
      c.set(`satcat:attempt:${todayUtc}`, "1", { NX: true, EX: 36 * 60 * 60 }),
    );
    if (attemptClaimed !== "OK") {
      success = true;
      return res.status(200).json({ ok: true, skipped: true });
    }
    ownsAttemptSlot = true;

    console.log("[refresh-satcat] Starting SATCAT refresh...");
    const startedAt = Date.now();

    // 1. Read last-used file number and existing catalog from Redis
    const [storedCatalogJson, storedFileNumber] = await withRedis(async (c) => {
      return await c.mGet(["satcat:catalog", "satcat:fileNumber"]);
    });

    const hadCatalog = Boolean(storedCatalogJson);
    const needsBootstrap = !hadCatalog || storedFileNumber === null;
    if (needsBootstrap && process.env.SATCAT_ALLOW_BOOTSTRAP !== "true") {
      throw new Error(
        "SATCAT catalog or file number is missing; a bootstrap is needed. " +
          'Set SATCAT_ALLOW_BOOTSTRAP="true" to allow one full fetch.',
      );
    }
    const fileNumber = needsBootstrap ? null : Number(storedFileNumber);

    // 2. Get a fresh (or cached) session cookie
    const cookieHeader = await getValidSessionCookie();

    // 3. Query Space-Track once; failures consume today's attempt.
    const records = await fetchSatcatRecords(cookieHeader, fileNumber);

    console.log(`[refresh-satcat] Fetched ${records.length} records.`);

    // 4. Parse existing catalog (needed for both zero-records and normal paths)
    const existingCatalog = storedCatalogJson
      ? JSON.parse(storedCatalogJson)
      : {};
    const catalog = typeof existingCatalog === "object" && existingCatalog !== null && !Array.isArray(existingCatalog)
      ? existingCatalog
      : {};

    if (!Array.isArray(records) || records.length === 0) {
      console.log(
        "[refresh-satcat] Space-Track returned 0 records — no update needed (no new SATCAT entries since last run).",
      );

      // Rebuild metrics from existing catalog and refresh timestamp
      const catalogEntries = Object.values(catalog);
      const computed = buildMetrics(catalogEntries);
      metrics = computed.metrics;

      await withRedis(async (c) => {
        const pipeline = c.multi();
        pipeline.set("satcat:latest", JSON.stringify(metrics));
        pipeline.set("satcat:lastUpdatedAt", new Date().toISOString());
        await pipeline.exec();
      });

      success = true;
      return res.status(200).json({
        ok: true,
        message: "No new SATCAT records — timestamp refreshed.",
        totalTracked: metrics.totalTracked,
        durationMs: Date.now() - startedAt,
      });
    }

    // 5. Merge incoming records into the full catalog and compute metrics from the merged data.

    for (const record of records) {
      const normalized = normalizeCatalogEntry(record);
      if (!normalized) continue;
      catalog[normalized.NORAD_CAT_ID] = normalized;
    }

    const catalogEntries = Object.values(catalog);
    const computed = buildMetrics(catalogEntries);
    metrics = computed.metrics;
    const { maxFileNumber } = computed;

    const serializedCatalog = JSON.stringify(catalog);
    console.log(`[refresh-satcat] Catalog size: ${serializedCatalog.length} bytes`);

    // 6. Persist catalog and metrics to Redis
    await withRedis(async (c) => {
      const pipeline = c.multi();
      pipeline.set("satcat:catalog", serializedCatalog);
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
    if (ownsAttemptSlot) {
      await logoutFromSpaceTrack();
    }
  }
}
