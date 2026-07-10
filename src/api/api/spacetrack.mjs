import { config } from "dotenv";

config({ path: ".env" });
config({ path: "./spacetrack.env" });

// Vercel serverless function — lives at /api/spacetrack.mjs (project root)
// Vercel injects SPACE_TRACK_USER / SPACE_TRACK_PASS via Project Settings → Environment Variables.
// In local development, dotenv loads the project env file if present.

// ⚠️ LIVE FETCHING TEMPORARILY DISABLED (2026-07-09) ⚠️
// Space-Track suspended this account for excessive SATCAT querying —
// every user page load was triggering a live query, so request volume
// scaled with site traffic instead of staying fixed. All the logic
// below is preserved and correct, it's just unreachable for now via
// the early return in the handler at the bottom of this file.
// Do NOT remove this comment block or the early return until
// api/cron/refresh-satcat.mjs (scheduled, fixed-rate fetching) is
// built and verified working — then delete this disabled block and
// the early return, and everything below resumes working as-is.

/*
let cachedCookieHeader = null;
let cachedCookieIssuedAt = 0;
const COOKIE_TTL_MS = 90 * 60 * 1000;
const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
const SATCAT_QUERY_URL =
  "https://www.space-track.org/basicspacedata/query/class/satcat/predicates/OBJECT_TYPE,LAUNCH,CURRENT,DECAY/format/json";

function getCookieHeaderValue(headers) {
  const rawCookies =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : null;

  return rawCookies
    ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
    : headers.get("set-cookie")?.split(";")[0] ?? null;
}

function buildMetrics(records) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const totalTracked = Array.isArray(records) ? records.length : 0;
  const addedLast30Days = Array.isArray(records)
    ? records.filter((record) => {
        if (!record?.LAUNCH) return false;
        const launchTime = Date.parse(record.LAUNCH);
        return Number.isFinite(launchTime) && launchTime >= thirtyDaysAgo;
      }).length
    : 0;

  const debrisCount = Array.isArray(records)
    ? records.filter((record) => (record?.OBJECT_TYPE || "").toUpperCase() === "DEBRIS").length
    : 0;
  const activeSatellites = Array.isArray(records)
    ? records.filter((record) => {
        const objectType = (record?.OBJECT_TYPE || "").toUpperCase();
        if (objectType !== "PAYLOAD") return false;
        const isCurrent = (record?.CURRENT || "").toUpperCase() === "Y";
        const notDecayed = !record?.DECAY || record.DECAY.trim() === "";
        return isCurrent || notDecayed;
      }).length
    : 0;

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

async function authenticateWithSpaceTrack(user, pass) {
  const authResponse = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ identity: user, password: pass }).toString(),
  });

  const cookieHeader = getCookieHeaderValue(authResponse.headers);

  if (!authResponse.ok || !cookieHeader) {
    throw new Error("Space-Track authentication failed.");
  }

  cachedCookieHeader = cookieHeader;
  cachedCookieIssuedAt = Date.now();
  return cookieHeader;
}

async function fetchSatcatData(user, pass) {
  const hasFreshCookie = Boolean(
    cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS,
  );

  let cookieHeader = hasFreshCookie ? cachedCookieHeader : null;

  if (!cookieHeader) {
    cookieHeader = await authenticateWithSpaceTrack(user, pass);
  }

  try {
    const dataResponse = await fetch(SATCAT_QUERY_URL, {
      headers: { Cookie: cookieHeader },
    });

    if (dataResponse.status === 401 || dataResponse.status === 403) {
      throw new Error("Space-Track session expired.");
    }

    if (!dataResponse.ok) {
      throw new Error(`Space-Track SATCAT query failed: HTTP ${dataResponse.status}`);
    }

    return dataResponse;
  } catch (error) {
    const shouldRetryWithFreshAuth =
      cookieHeader === cachedCookieHeader &&
      error instanceof Error &&
      error.message === "Space-Track session expired.";

    if (!shouldRetryWithFreshAuth) {
      throw error;
    }

    cachedCookieHeader = null;
    cachedCookieIssuedAt = 0;

    const freshCookieHeader = await authenticateWithSpaceTrack(user, pass);
    const retryResponse = await fetch(SATCAT_QUERY_URL, {
      headers: { Cookie: freshCookieHeader },
    });

    if (!retryResponse.ok) {
      throw new Error(`Space-Track SATCAT query failed: HTTP ${retryResponse.status}`);
    }

    return retryResponse;
  }
}
*/

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // See disabled block above — remove this early return once the
  // cron-based fetch system replaces direct live querying.
  return res.status(503).json({
    error: "Live Space-Track data temporarily disabled.",
    liveDataDisabled: true,
    message:
      "Refactoring to comply with Space-Track's API usage policy. Live fetching will resume once scheduled, rate-limited requests are in place.",
  });

  /*
  const user = process.env.SPACE_TRACK_USER;
  const pass = process.env.SPACE_TRACK_PASS;

  if (!user || !pass) {
    return res.status(500).json({
      error:
        "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS — add them in Vercel Project Settings → Environment Variables.",
    });
  }

  try {
    const dataResponse = await fetchSatcatData(user, pass);
    const payload = await dataResponse.json();
    const metrics = buildMetrics(payload);

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    return res.status(200).json(metrics);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown Space-Track proxy error",
    });
  }
  */
}