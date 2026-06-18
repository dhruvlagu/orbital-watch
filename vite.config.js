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
                                res.end(JSON.stringify({
                                    error: "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
                                }));
                                return;
                            }
                            const loginBody = new URLSearchParams({
                                identity: user,
                                password: pass,
                            }).toString();
                            const authResponse = await fetch("https://www.space-track.org/ajaxauth/login", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: loginBody,
                            });
                            const setCookies = authResponse.headers.getSetCookie?.();
                            const cookieHeader = setCookies
                                ?.map((cookie) => cookie.split(";")[0])
                                .join("; ")
                                .trim() || authResponse.headers.get("set-cookie")?.split(";")[0];
                            if (!authResponse.ok || !cookieHeader) {
                                throw new Error("Space-Track authentication failed.");
                            }
                            const dataResponse = await fetch("https://www.space-track.org/basicspacedata/query/class/satcat/format/json", {
                                headers: {
                                    Cookie: cookieHeader,
                                },
                            });
                            if (!dataResponse.ok) {
                                throw new Error(`SATCAT query failed with status ${dataResponse.status}`);
                            }
                            const payload = await dataResponse.text();
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.end(payload);
                        }
                        catch (error) {
                            res.statusCode = 500;
                            res.setHeader("Content-Type", "application/json");
                            res.end(JSON.stringify({
                                error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
                            }));
                        }
                    });
                },
            },
        ],
    };
});
