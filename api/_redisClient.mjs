// api/_redisClient.mjs
// Shared Redis connection helper using connect-per-call, always-close pattern.
// This avoids connection-pool exhaustion on Vercel's free tier (30 max connections).
// Never hold a connection open across invocations.

import { createClient } from "redis";

/**
 * Opens a Redis connection, runs fn(client), then closes the connection.
 * The connection is closed in a finally block, so it always closes even on error.
 *
 * @template T
 * @param {(client: import("redis").RedisClientType) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withRedis(fn) {
  const client = createClient({ url: process.env.STORAGE_REDIS_URL });
  client.on("error", (err) => console.error("[Redis] client error:", err));

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.quit();
  }
}
