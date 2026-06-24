// Vercel serverless function — lives at /api/spacetrack.mjs (project root)
// Vercel injects SPACE_TRACK_USER / SPACE_TRACK_PASS via Project Settings → Environment Variables.
// No dotenv import needed: process.env is populated by the Vercel runtime.

export default async function handler(req, res) {
  // Only allow GET
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
    // Step 1: authenticate with Space-Track
    const authResponse = await fetch("https://www.space-track.org/ajaxauth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ identity: user, password: pass }).toString(),
    });

    // Extract session cookie — try getSetCookie() first (Node 18+), fall back to get()
    const rawCookies =
      typeof authResponse.headers.getSetCookie === "function"
        ? authResponse.headers.getSetCookie()
        : null;

    const cookieHeader = rawCookies
      ? rawCookies.map((c) => c.split(";")[0]).join("; ")
      : authResponse.headers.get("set-cookie")?.split(";")[0] ?? null;

    if (!authResponse.ok || !cookieHeader) {
      return res.status(502).json({ error: "Space-Track authentication failed." });
    }

    // Step 2: fetch SATCAT data
    const dataResponse = await fetch(
      "https://www.space-track.org/basicspacedata/query/class/satcat/format/json",
      { headers: { Cookie: cookieHeader } }
    );

    if (!dataResponse.ok) {
      return res.status(502).json({
        error: `Space-Track SATCAT query failed: HTTP ${dataResponse.status}`,
      });
    }

    const payload = await dataResponse.json();

    // Cache for 1 day on Vercel's edge (stale-while-revalidate keeps it fast)
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown Space-Track proxy error",
    });
  }
}
