// api/conjunctions.mjs
// User-facing endpoint — reads CDM conjunction records from Redis only.
// Space-Track is NEVER queried here. Data is populated by api/cron/refresh-cdm.mjs
// which is triggered 3x/day by an external Cloudflare Worker.

import { withRedis } from "./_redisClient.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [cdmJson, lastChecked] = await withRedis((c) =>
      Promise.all([
        c.get("cdm:latest"),
        c.get("cdm:lastChecked"),
      ]),
    );

    if (!cdmJson) {
      // Cron hasn't run yet (new deployment / first-time setup).
      // Trigger /api/cron/refresh-cdm manually with a valid CRON_SECRET
      // bearer token to populate data for the first time.
      return res.status(503).json({
        error: "Conjunction data not yet available.",
        dataNotYetAvailable: true,
        message:
          "Data is populated 3x daily by a scheduled job. " +
          "If this is a new deployment, trigger /api/cron/refresh-cdm manually to seed the cache.",
      });
    }

    const records = JSON.parse(cdmJson);

    // 1-hour edge cache — CDM cron runs 3x daily (~8h apart)
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({
      records,
      lastUpdatedAt: lastChecked,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error reading cached data";
    console.error("[/api/conjunctions] Redis read error:", message);
    return res.status(500).json({ error: message });
  }
}