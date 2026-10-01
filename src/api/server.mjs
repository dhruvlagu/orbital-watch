import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: ".env" });

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

async function proxyProductionEndpoint(req, res) {
  try {
    const targetUrl = new URL(req.url || "/", "https://orbitalwatch.app");
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { Accept: req.headers.accept || "application/json" },
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    const headers = {};
    for (const name of ["content-type", "cache-control"]) {
      const value = upstream.headers.get(name);
      if (value) headers[name] = value;
    }
    res.writeHead(upstream.status, headers);
    res.end(body);
  } catch (error) {
    console.error(
      "[local-api] Production API proxy failed:",
      error instanceof Error ? error.message : String(error),
    );
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unable to reach the production API." }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (
      req.url?.startsWith("/api/spacetrack/satcat") ||
      req.url?.startsWith("/api/spacetrack/conjunctions")
    ) {
      return await proxyProductionEndpoint(req, res);
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
