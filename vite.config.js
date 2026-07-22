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
                    let cachedCookieHeader = null;
                    let cachedCookieIssuedAt = 0;
                    const COOKIE_TTL_MS = 90 * 60 * 1000;
                    const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
                    const getCookieHeaderValue = (headers) => {
                        const rawCookies = headers.getSetCookie?.();
                        return rawCookies
                            ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
                            : headers.get("set-cookie")?.split(";")[0] ?? null;
                    };
                    const authenticateWithSpaceTrack = async (user, pass) => {
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
                    // ─── Spacetrack Satcat Endpoint ──────────────────────────────────
                    server.middlewares.use("/api/spacetrack/satcat", async (_req, res) => {
                        try {
                            const user = env.SPACE_TRACK_USER || process.env.SPACE_TRACK_USER;
                            const pass = env.SPACE_TRACK_PASS || process.env.SPACE_TRACK_PASS;
                            if (!user || !pass) {
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({
                                    error: "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
                                }));
                                return;
                            }
                            const SATCAT_QUERY_URL = "https://www.space-track.org/basicspacedata/query/class/satcat/predicates/OBJECT_TYPE,LAUNCH,CURRENT,DECAY/format/json";
                            const buildMetrics = (records) => {
                                const now = Date.now();
                                const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                                const totalTracked = Array.isArray(records) ? records.length : 0;
                                const addedLast30Days = Array.isArray(records)
                                    ? records.filter((record) => {
                                        const launch = record?.LAUNCH;
                                        if (!launch)
                                            return false;
                                        const launchTime = Date.parse(launch);
                                        return Number.isFinite(launchTime) && launchTime >= thirtyDaysAgo;
                                    }).length
                                    : 0;
                                const debrisCount = Array.isArray(records)
                                    ? records.filter((record) => record?.OBJECT_TYPE?.toUpperCase() === "DEBRIS").length
                                    : 0;
                                const activeSatellites = Array.isArray(records)
                                    ? records.filter((record) => {
                                        const objectType = record?.OBJECT_TYPE?.toUpperCase();
                                        if (objectType !== "PAYLOAD")
                                            return false;
                                        const isCurrent = record?.CURRENT?.toUpperCase() === "Y";
                                        const notDecayed = !record?.DECAY || String(record.DECAY).trim() === "";
                                        return isCurrent || notDecayed;
                                    }).length
                                    : 0;
                                const debrisToActiveRatio = activeSatellites > 0
                                    ? `${Math.max(1, Math.round(debrisCount / activeSatellites))}:1`
                                    : "N/A";
                                return {
                                    totalTracked,
                                    addedLast30Days,
                                    debrisToActiveRatio,
                                    highestRiskShell: "LEO 800–1000km",
                                };
                            };
                            const fetchSatcatData = async () => {
                                const hasFreshCookie = Boolean(cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS);
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
                                }
                                catch (error) {
                                    if (!(error instanceof Error) || error.message !== "Space-Track session expired.") {
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
                            };
                            const dataResponse = await fetchSatcatData();
                            const payload = await dataResponse.json();
                            const metrics = buildMetrics(payload);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
                            res.end(JSON.stringify(metrics));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({
                                error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
                            }));
                        }
                    });
                    // ─── Conjunctions Endpoint ───────────────────────────────────────
                    const handleConjunctionsRoute = async (_req, res) => {
                        try {
                            const user = env.SPACE_TRACK_USER || process.env.SPACE_TRACK_USER;
                            const pass = env.SPACE_TRACK_PASS || process.env.SPACE_TRACK_PASS;
                            if (!user || !pass) {
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({
                                    error: "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
                                }));
                                return;
                            }
                            const CDM_QUERY_URL = "https://www.space-track.org/basicspacedata/query/class/cdm_public/TCA/>now/orderby/TCA asc/limit/25/format/json";
                            const fetchCdmData = async () => {
                                const hasFreshCookie = Boolean(cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS);
                                let cookieHeader = hasFreshCookie ? cachedCookieHeader : null;
                                if (!cookieHeader) {
                                    cookieHeader = await authenticateWithSpaceTrack(user, pass);
                                }
                                try {
                                    const dataResponse = await fetch(CDM_QUERY_URL, {
                                        headers: {
                                            Cookie: cookieHeader,
                                        },
                                    });
                                    if (dataResponse.status === 401 || dataResponse.status === 403) {
                                        throw new Error("Space-Track session expired.");
                                    }
                                    if (!dataResponse.ok) {
                                        throw new Error(`CDM query failed with status ${dataResponse.status}`);
                                    }
                                    return dataResponse;
                                }
                                catch (error) {
                                    if (!(error instanceof Error) || error.message !== "Space-Track session expired.") {
                                        throw error;
                                    }
                                    cachedCookieHeader = null;
                                    cachedCookieIssuedAt = 0;
                                    const freshCookieHeader = await authenticateWithSpaceTrack(user, pass);
                                    const retryResponse = await fetch(CDM_QUERY_URL, {
                                        headers: {
                                            Cookie: freshCookieHeader,
                                        },
                                    });
                                    if (!retryResponse.ok) {
                                        throw new Error(`CDM query failed with status ${retryResponse.status}`);
                                    }
                                    return retryResponse;
                                }
                            };
                            const dataResponse = await fetchCdmData();
                            const payload = await dataResponse.json();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
                            res.end(JSON.stringify({ records: payload, lastUpdatedAt: new Date().toISOString() }));
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({
                                error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
                                details: error instanceof Error ? error.stack : undefined,
                            }));
                        }
                    };
                    const handleRepresentativeRoute = async (req, res) => {
                        try {
                            const urlObj = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
                            const zip = urlObj.searchParams.get("zip") || urlObj.searchParams.get("q");
                            if (!zip) {
                                res.statusCode = 400;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: "Missing or invalid zip code parameter." }));
                                return;
                            }
                            const apiKey = env.GEOCODIO_API_KEY || process.env.GEOCODIO_API_KEY;
                            if (!apiKey) {
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: "Missing GEOCODIO_API_KEY environment variable." }));
                                return;
                            }
                            const geocodioUrl = `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(zip.trim())}&fields=cd&api_key=${apiKey}`;
                            const apiRes = await fetch(geocodioUrl);
                            if (!apiRes.ok) {
                                res.statusCode = 502;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: "Unable to reach address lookup service." }));
                                return;
                            }
                            const data = await apiRes.json();
                            const results = data.results;
                            if (!Array.isArray(results) || results.length === 0) {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ noMatch: true, message: "No match found for this zip code." }));
                                return;
                            }
                            let bestDistrict = null;
                            let maxProportion = -1;
                            for (const result of results) {
                                const districts = result.fields?.congressional_districts;
                                if (Array.isArray(districts) && districts.length > 0) {
                                    for (const dist of districts) {
                                        const prop = typeof dist.proportion === "number" ? dist.proportion : 1;
                                        if (prop > maxProportion) {
                                            maxProportion = prop;
                                            bestDistrict = dist;
                                        }
                                    }
                                }
                            }
                            if (!bestDistrict) {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ noMatch: true, message: "No congressional district found for this zip code." }));
                                return;
                            }
                            const legislators = bestDistrict.current_legislators;
                            if (!Array.isArray(legislators) || legislators.length === 0) {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ noMatch: true, message: "No legislators found for this district." }));
                                return;
                            }
                            const rep = legislators.find((l) => l.type === "representative");
                            if (!rep) {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ noMatch: true, message: "No House representative found for this district." }));
                                return;
                            }
                            const bio = rep.bio || {};
                            const contact = rep.contact || {};
                            const firstName = bio.first_name || "";
                            const lastName = bio.last_name || "";
                            const representativeName = `${firstName} ${lastName}`.trim() || "Representative";
                            const districtNumber = typeof bestDistrict.district_number === "number"
                                ? bestDistrict.district_number
                                : parseInt(bestDistrict.district_number || "0", 10);
                            const matchProportion = maxProportion > 0 ? maxProportion : 1;
                            const isAmbiguousMatch = matchProportion < 0.9;
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({
                                representativeName,
                                district: districtNumber,
                                matchProportion,
                                isAmbiguousMatch,
                                contact: {
                                    contactForm: contact.contact_form || null,
                                    officialSite: contact.url || null,
                                    phone: contact.phone || null,
                                    mailingAddress: contact.address || null,
                                },
                            }));
                        }
                        catch (err) {
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({ error: err?.message || "Failed to perform representative lookup." }));
                        }
                    };
                    server.middlewares.use("/api/spacetrack/conjunctions", handleConjunctionsRoute);
                    server.middlewares.use("/api/conjunctions", handleConjunctionsRoute);
                    server.middlewares.use("/api/spacetrack/representative", handleRepresentativeRoute);
                    server.middlewares.use("/api/representative", handleRepresentativeRoute);
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
