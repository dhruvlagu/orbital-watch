import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      {
        name: "space-track-proxy",
        configureServer(server) {
          server.middlewares.use("/api/spacetrack/satcat", async (_req, res) => {
            try {
              const user = env.SPACE_TRACK_USER || process.env.SPACE_TRACK_USER;
              const pass = env.SPACE_TRACK_PASS || process.env.SPACE_TRACK_PASS;

              if (!user || !pass) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error:
                      "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
                  }),
                );
                return;
              }

              let cachedCookieHeader: string | null = null;
              let cachedCookieIssuedAt = 0;
              const COOKIE_TTL_MS = 90 * 60 * 1000;
              const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
              const SATCAT_QUERY_URL =
                "https://www.space-track.org/basicspacedata/query/class/satcat/predicates/OBJECT_TYPE,LAUNCH,CURRENT,DECAY/format/json";

              const getCookieHeaderValue = (headers: Headers) => {
                const rawCookies = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
                return rawCookies
                  ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
                  : headers.get("set-cookie")?.split(";")[0] ?? null;
              };

              const buildMetrics = (records: Array<Record<string, unknown>>) => {
                const now = Date.now();
                const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                const totalTracked = Array.isArray(records) ? records.length : 0;
                const addedLast30Days = Array.isArray(records)
                  ? records.filter((record) => {
                      const launch = record?.LAUNCH as string | undefined;
                      if (!launch) return false;
                      const launchTime = Date.parse(launch);
                      return Number.isFinite(launchTime) && launchTime >= thirtyDaysAgo;
                    }).length
                  : 0;
                const debrisCount = Array.isArray(records)
                  ? records.filter((record) => (record?.OBJECT_TYPE as string | undefined)?.toUpperCase() === "DEBRIS").length
                  : 0;
                const activeSatellites = Array.isArray(records)
                  ? records.filter((record) => {
                      const objectType = (record?.OBJECT_TYPE as string | undefined)?.toUpperCase();
                      if (objectType !== "PAYLOAD") return false;
                      const isCurrent = (record?.CURRENT as string | undefined)?.toUpperCase() === "Y";
                      const notDecayed = !record?.DECAY || String(record.DECAY).trim() === "";
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
              };

              const authenticateWithSpaceTrack = async () => {
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
              };

              const fetchSatcatData = async () => {
                const hasFreshCookie = Boolean(
                  cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS,
                );

                let cookieHeader = hasFreshCookie ? cachedCookieHeader : null;
                if (!cookieHeader) {
                  cookieHeader = await authenticateWithSpaceTrack();
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
                  if (!(error instanceof Error) || error.message !== "Space-Track session expired.") {
                    throw error;
                  }

                  cachedCookieHeader = null;
                  cachedCookieIssuedAt = 0;
                  const freshCookieHeader = await authenticateWithSpaceTrack();
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
              };

              const dataResponse = await fetchSatcatData();
              const payload = await dataResponse.json();
              const metrics = buildMetrics(payload as Array<Record<string, unknown>>);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
              res.end(JSON.stringify(metrics));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error:
                    error instanceof Error ? error.message : "Unknown Space-Track proxy error",
                }),
              );
            }
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler") || id.includes("prop-types")) {
                return "vendor";
              }
              if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
                return "charts";
              }
              return "deps"; // Other third party dependencies
            }
          },
        },
      },
    },
  };
});
