// api/spacetrack.mjs
// User-facing endpoint — reads SATCAT metrics from Redis only.
// Space-Track is NEVER queried here. Data is populated by api/cron/refresh-satcat.mjs
// which runs once daily via Vercel Cron Jobs.

import { withRedis } from "./_redisClient.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [metricsJson, lastUpdatedAt] = await withRedis((c) =>
      Promise.all([
        c.get("satcat:latest"),
        c.get("satcat:lastUpdatedAt"),
      ]),
    );

    if (!metricsJson) {
      // Cron hasn't run yet (new deployment / first-time setup).
      // Trigger /api/cron/refresh-satcat manually with a valid CRON_SECRET
      // bearer token to populate data for the first time.
      return res.status(503).json({
        error: "Orbital data not yet available.",
        dataNotYetAvailable: true,
        message:
          "Data is populated once daily by a scheduled job. " +
          "If this is a new deployment, trigger /api/cron/refresh-satcat manually to seed the cache.",
      });
    }

    const metrics = JSON.parse(metricsJson);

    // 5-minute edge cache — updates reflect on production within 5 mins of Redis refresh
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      ...metrics,
      lastUpdatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error reading cached data";
    console.error("[/api/spacetrack] Redis read error:", message);
    return res.status(500).json({ error: message });
  }
}