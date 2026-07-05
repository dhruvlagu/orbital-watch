import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: "./spacetrack.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 5173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function safePath(requestPath) {
  const cleaned = decodeURIComponent(requestPath.split("?")[0]).replaceAll("\\", "/");
  const normalized = path.normalize(cleaned).replace(/^(\.\.[/\\])+/, "");
  return normalized === "/" ? "/index.html" : normalized;
}

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (dataResponse.status === 401 || dataResponse.status === 403) {
      throw new Error("Space-Track session expired.");
    }

    if (!dataResponse.ok) {
      throw new Error(`SATCAT query failed with status ${dataResponse.status}`);
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
      headers: {
        Cookie: freshCookieHeader,
      },
    });

    if (!retryResponse.ok) {
      throw new Error(`SATCAT query failed with status ${retryResponse.status}`);
    }

    return retryResponse;
  }
}

async function handleSpaceTrackProxy(req, res) {
  try {
    const user = process.env.SPACE_TRACK_USER;
    const pass = process.env.SPACE_TRACK_PASS;

    if (!user || !pass) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
      }));
      return;
    }

    const dataResponse = await fetchSatcatData(user, pass);
    const payload = await dataResponse.json();
    const metrics = buildMetrics(payload);

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate",
    });
    res.end(JSON.stringify(metrics));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
    }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    // Handle Space-Track API endpoint
    if (req.url?.startsWith("/api/spacetrack/satcat")) {
      return await handleSpaceTrackProxy(req, res);
    }

    const urlPath = safePath(req.url || "/");
    const filePath = path.join(__dirname, urlPath);

    const ext = path.extname(filePath).toLowerCase();
    const type = contentTypes[ext] || "application/octet-stream";

    const file = await readFile(filePath);
    res.writeHead(200, { "Content-Type": type });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Local preview running at http://localhost:${port}`);
});

