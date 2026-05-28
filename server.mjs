import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: "./spacetrack.env" });

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

async function handleSpaceTrackProxy(req, res) {
  try {
    const user = process.env.SPACE_TRACK_USER;
    const pass = process.env.SPACE_TRACK_PASS;

    if (!user || !pass) {
      res.writeHead(500, { "Content-Type": "application/json" });
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

    const payload = await dataResponse.text();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(payload);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown Space-Track proxy error",
    }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    // Handle Space-Track API endpoint
    if (req.url?.startsWith("/api/spacetrack/satcat")) {
      return await handleSpaceTrackProxy(req, res);
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

