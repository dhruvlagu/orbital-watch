// api/cron/_spacetrackAuth.mjs
// Shared Space-Track session-cookie auth helper for cron functions.
// Cookie is cached in module scope (survives warm invocations) with a 90-minute TTL.
// Never import this from user-facing endpoints — only from cron handlers.

const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
const COOKIE_TTL_MS = 90 * 60 * 1000; // 90 minutes

let cachedCookieHeader = null;
let cachedCookieIssuedAt = 0;

/**
 * Extracts a usable Cookie header value from the Set-Cookie response header.
 * Handles both the modern getSetCookie() array API and the legacy string fallback.
 *
 * @param {Headers} headers
 * @returns {string | null}
 */
function getCookieHeaderValue(headers) {
  const rawCookies =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : null;

  return rawCookies
    ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
    : headers.get("set-cookie")?.split(";")[0] ?? null;
}

/**
 * Authenticates with Space-Track using the provided credentials.
 * Stores the session cookie in module scope for reuse.
 *
 * @param {string} user
 * @param {string} pass
 * @returns {Promise<string>} session cookie header value
 */
async function authenticateWithSpaceTrack(user, pass) {
  console.log("[SpaceTrack Auth] Requesting new session cookie...");

  const authResponse = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ identity: user, password: pass }).toString(),
  });

  const cookieHeader = getCookieHeaderValue(authResponse.headers);

  if (!authResponse.ok || !cookieHeader) {
    throw new Error(
      `Space-Track authentication failed (HTTP ${authResponse.status}). ` +
        "Check SPACE_TRACK_USER and SPACE_TRACK_PASS environment variables.",
    );
  }

  cachedCookieHeader = cookieHeader;
  cachedCookieIssuedAt = Date.now();
  console.log("[SpaceTrack Auth] Session cookie obtained successfully.");
  return cookieHeader;
}

/**
 * Returns a valid (fresh or cached) Space-Track session cookie.
 * Fetches a new one if the cached cookie is missing or older than 90 minutes.
 *
 * @returns {Promise<string>} session cookie header value
 */
export async function getValidSessionCookie() {
  const user = process.env.SPACE_TRACK_USER;
  const pass = process.env.SPACE_TRACK_PASS;

  if (!user || !pass) {
    throw new Error(
      "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS — set them in Vercel Project Settings → Environment Variables.",
    );
  }

  const hasFreshCookie = Boolean(
    cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS,
  );

  if (hasFreshCookie) {
    console.log("[SpaceTrack Auth] Reusing cached session cookie.");
    return cachedCookieHeader;
  }

  return authenticateWithSpaceTrack(user, pass);
}

/**
 * Invalidates the in-memory session cookie cache (used on auth failure before retry).
 */
export function invalidateSessionCookie() {
  cachedCookieHeader = null;
  cachedCookieIssuedAt = 0;
}
