// Vercel serverless function — api/conjunctions.mjs
// Fetches upcoming conjunction/close-approach events from Space-Track CDM Public class.
// Same auth pattern as api/spacetrack.mjs (cookie-based session with in-memory cache).

let cachedCookieHeader = null;
let cachedCookieIssuedAt = 0;
const COOKIE_TTL_MS = 90 * 60 * 1000;

const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
const CDM_QUERY_URL =
  "https://www.space-track.org/basicspacedata/query/class/cdm_public/TCA/%3Enow/orderby/TCA%20asc/limit/25/format/json";

function getCookieHeaderValue(headers) {
  const rawCookies =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : null;

  return rawCookies
    ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
    : headers.get("set-cookie")?.split(";")[0] ?? null;
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

async function fetchCdmData(user, pass) {
  const hasFreshCookie = Boolean(
    cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS,
  );

  let cookieHeader = hasFreshCookie ? cachedCookieHeader : null;

  if (!cookieHeader) {
    cookieHeader = await authenticateWithSpaceTrack(user, pass);
  }

  try {
    const dataResponse = await fetch(CDM_QUERY_URL, {
      headers: { Cookie: cookieHeader },
    });

    if (dataResponse.status === 401 || dataResponse.status === 403) {
      throw new Error("Space-Track session expired.");
    }

    if (!dataResponse.ok) {
      throw new Error(`Space-Track CDM query failed: HTTP ${dataResponse.status}`);
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

    // Clear stale cookie and retry once with fresh auth
    cachedCookieHeader = null;
    cachedCookieIssuedAt = 0;

    const freshCookieHeader = await authenticateWithSpaceTrack(user, pass);
    const retryResponse = await fetch(CDM_QUERY_URL, {
      headers: { Cookie: freshCookieHeader },
    });

    if (!retryResponse.ok) {
      throw new Error(`Space-Track CDM query failed on retry: HTTP ${retryResponse.status}`);
    }

    return retryResponse;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = process.env.SPACE_TRACK_USER;
  const pass = process.env.SPACE_TRACK_PASS;

  if (!user || !pass) {
    return res.status(500).json({
      error:
        "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS — add them in Vercel Project Settings → Environment Variables.",
    });
  }

  try {
    const dataResponse = await fetchCdmData(user, pass);
    const payload = await dataResponse.json();

    // 1-hour edge cache — CDM data updates a few times daily, not constantly
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown Space-Track CDM proxy error",
    });
  }
}
