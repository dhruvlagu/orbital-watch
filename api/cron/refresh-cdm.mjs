// api/cron/refresh-cdm.mjs
// CDM refresh handler — called 3x/day by an external Cloudflare Worker.
// This is the ONLY place in the codebase that queries Space-Track's cdm_public class.
// User-facing /api/conjunctions reads from Redis; it never calls Space-Track.
//
// External trigger schedule (Cloudflare Worker): "14 13,21,5 * * *" (UTC)
// Offset from the hour per Space-Track's request to avoid busy traffic windows.
// Bearer-token auth (CRON_SECRET) is the only access control — Vercel cron
// auth headers will NOT be present since this is triggered externally.

import { withRedis } from "../_redisClient.mjs";
import {
  getValidSessionCookie,
  invalidateSessionCookie,
} from "./_spacetrackAuth.mjs";

// NOTE: We import dedupeRawCdmRecords as plain JS — the .ts source is only
// available in the browser build. The logic is duplicated here intentionally
// so the serverless function doesn't depend on Vite/tsc's output.
// Keep both in sync if the deduplication rule ever changes.

const CDM_QUERY_URL =
  "https://www.space-track.org/basicspacedata/query/class/cdm_public/CREATED/%3Enow-1/orderby/TCA%20asc/format/json";

// ─── Auth check ───────────────────────────────────────────────────────────────

function isAuthorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[refresh-cdm] CRON_SECRET is not set — rejecting all requests.");
    return false;
  }
  const authHeader = req.headers["authorization"] ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Deduplicate CDM records ──────────────────────────────────────────────────

/**
 * Deduplicates raw CDM records by the canonical pair (sorted sat names) + TCA.
 * Mirrors the logic in src/services/conjunctionData.ts#dedupeRawCdmRecords.
 *
 * @param {Array<Record<string, string>>} records
 * @returns {Array<Record<string, string>>}
 */
function dedupeRawCdmRecords(records) {
  const seen = new Set();
  return records.filter((r) => {
    const sat1 = (r.SAT_1_NAME || "").trim();
    const sat2 = (r.SAT_2_NAME || "").trim();
    const [first, second] = sat1 < sat2 ? [sat1, sat2] : [sat2, sat1];
    const key = `${first}|${second}|${r.TCA}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Filter expired events ────────────────────────────────────────────────────

/**
 * Removes records whose TCA (Time of Closest Approach) has already passed.
 *
 * @param {Array<Record<string, string>>} records
 * @returns {Array<Record<string, string>>}
 */
function filterFutureEvents(records) {
  const now = Date.now();
  return records.filter((r) => {
    const tcaMs = Date.parse(r.TCA);
    return Number.isFinite(tcaMs) && tcaMs > now;
  });
}

// ─── Space-Track query ────────────────────────────────────────────────────────

async function fetchCdmRecords(cookieHeader) {
  const dataResponse = await fetch(CDM_QUERY_URL, {
    headers: { Cookie: cookieHeader },
  });

  if (dataResponse.status === 401 || dataResponse.status === 403) {
    throw new Error("Space-Track session expired.");
  }

  if (!dataResponse.ok) {
    throw new Error(`Space-Track CDM query failed: HTTP ${dataResponse.status}`);
  }

  return dataResponse.json();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized — invalid or missing CRON_SECRET." });
  }

  console.log("[refresh-cdm] Starting CDM refresh...");
  const startedAt = Date.now();

  try {
    // 1. Get a fresh (or cached) session cookie
    let cookieHeader = await getValidSessionCookie();

    // 2. Query Space-Track for records created in the last 24h (with one retry on expiry)
    let newRecords;
    try {
      newRecords = await fetchCdmRecords(cookieHeader);
    } catch (err) {
      if (err instanceof Error && err.message === "Space-Track session expired.") {
        console.warn("[refresh-cdm] Session expired, re-authenticating...");
        invalidateSessionCookie();
        cookieHeader = await getValidSessionCookie();
        newRecords = await fetchCdmRecords(cookieHeader);
      } else {
        throw err;
      }
    }

    if (!Array.isArray(newRecords)) {
      throw new Error("Space-Track CDM returned an unexpected non-array payload.");
    }

    console.log(`[refresh-cdm] Fetched ${newRecords.length} new CDM records from Space-Track.`);

    // 3. Read existing stored records from Redis
    const existingJson = await withRedis((c) => c.get("cdm:latest"));
    const existingRecords = existingJson ? JSON.parse(existingJson) : [];

    // 4. Merge, deduplicate, and filter to only future events
    const merged = dedupeRawCdmRecords([...newRecords, ...existingRecords]);
    const filtered = filterFutureEvents(merged);

    console.log(
      `[refresh-cdm] After merge+dedupe+filter: ${filtered.length} records ` +
        `(was ${existingRecords.length} stored, ${newRecords.length} new).`,
    );

    // 5. Persist back to Redis
    await withRedis(async (c) => {
      const pipeline = c.multi();
      pipeline.set("cdm:latest", JSON.stringify(filtered));
      pipeline.set("cdm:lastChecked", new Date().toISOString());
      await pipeline.exec();
    });

    const durationMs = Date.now() - startedAt;
    console.log(`[refresh-cdm] Done. durationMs=${durationMs}`);

    return res.status(200).json({
      ok: true,
      stored: filtered.length,
      fetched: newRecords.length,
      durationMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[refresh-cdm] ERROR:", message);
    return res.status(500).json({ ok: false, error: message });
  }
}
