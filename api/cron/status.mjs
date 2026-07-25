// Read-only cron execution history endpoint.

import { withRedis } from "../_redisClient.mjs";

function isAuthorized(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = req.headers["authorization"] ?? "";
  return authHeader === `Bearer ${cronSecret}`;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized — invalid or missing CRON_SECRET." });
  }

  const [satcatLog, cdmLog] = await withRedis((c) =>
    Promise.all([
      c.lRange("satcat:executionLog", 0, -1),
      c.lRange("cdm:executionLog", 0, -1),
    ]),
  );

  return res.status(200).json({
    satcat: satcatLog.map((entry) => JSON.parse(entry)),
    cdm: cdmLog.map((entry) => JSON.parse(entry)),
  });
}
