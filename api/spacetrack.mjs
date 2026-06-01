import { config } from "dotenv";

// Load environment variables from spacetrack.env
config({ path: "./spacetrack.env" });

export default async function handler(req, res) {
  // Only allow GET requests to /api/spacetrack/satcat
  if (req.method !== "GET" || !req.url?.includes("satcat")) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    const user = process.env.SPACE_TRACK_USER;
    const pass = process.env.SPACE_TRACK_PASS;

    if (!user || !pass) {
      return res.status(500).json({
        error: "Missing SPACE_TRACK_USER or SPACE_TRACK_PASS environment variables.",
      });
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
    const cookieHeader =
      setCookies
        ?.map((cookie) => cookie.split(";")[0])
        .join("; ")
        .trim() || authResponse.headers.get("set-cookie")?.split(";")[0];

    if (!authResponse.ok || !cookieHeader) {
      throw new Error("Space-Track authentication failed.");
    }

    const dataResponse = await fetch(
      "https://www.space-track.org/basicspacedata/query/class/satcat/format/json",
      {
        headers: {
          Cookie: cookieHeader,
        },
      },
    );

    if (!dataResponse.ok) {
      throw new Error(`SATCAT query failed with status ${dataResponse.status}`);
    }

    const payload = await dataResponse.json();
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
    });
  }
}
