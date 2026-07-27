import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = join(projectRoot, "dist");
const viteCli = join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const localChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

const routes = [
  "/",
  "/crisis",
  "/collision-watch",
  "/physics",
  "/policy",
  "/solutions",
  "/get-involved",
  "/about",
];

function isLocalMacBuild() {
  return process.platform === "darwin";
}

async function startPreviewServer() {
  const preview = spawn(process.execPath, [viteCli, "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: projectRoot,
    stdio: ["ignore", "ignore", "pipe"],
  });
  let startupError = "";
  preview.stderr.on("data", (chunk) => {
    startupError += chunk;
  });

  const isReady = await new Promise((resolveReady, rejectReady) => {
    const deadline = Date.now() + 15_000;
    const timer = setInterval(() => {
      fetch(baseUrl)
        .then((response) => {
          if (response.ok) {
            clearInterval(timer);
            resolveReady(true);
          }
        })
        .catch(() => {
          if (Date.now() > deadline) {
            clearInterval(timer);
            rejectReady(new Error(`Vite preview did not start within 15 seconds. ${startupError}`));
          }
        });
    }, 200);
    preview.once("exit", (code) => {
      clearInterval(timer);
      rejectReady(new Error(`Vite preview exited with code ${code}. ${startupError}`));
    });
  });

  if (!isReady) throw new Error("Vite preview did not start.");
  return preview;
}

async function launchBrowser() {
  if (isLocalMacBuild()) {
    await access(localChromePath);
    return puppeteer.launch({
      executablePath: localChromePath,
      headless: true,
      defaultViewport: { width: 1440, height: 1200, deviceScaleFactor: 1 },
    });
  }

  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
    defaultViewport: { width: 1440, height: 1200, deviceScaleFactor: 1 },
  });
}

function outputPathForRoute(route) {
  return route === "/" ? join(distDirectory, "index.html") : join(distDirectory, route.slice(1), "index.html");
}

async function prerenderRoute(page, route) {
  const expectedCanonical = `https://orbitalwatch.vercel.app${route}`;
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle0" });
  await page.waitForSelector("h1", { timeout: 30_000 });
  await page.waitForFunction(
    (canonicalUrl) => document.querySelector('link[rel="canonical"]')?.getAttribute("href") === canonicalUrl,
    { timeout: 30_000 },
    expectedCanonical,
  );
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));

  const outputPath = outputPathForRoute(route);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, await page.content(), "utf8");
  console.log(`Prerendered ${route}`);
}

let preview;
let browser;

try {
  preview = await startPreviewServer();
  browser = await launchBrowser();
  const page = await browser.newPage();

  for (const route of routes) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        await prerenderRoute(page, route);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) {
      console.warn(`Prerender failed for ${route}, falling back to SPA shell for this route: ${lastError.message}`);
    }
  }
} finally {
  await browser?.close();
  preview?.kill("SIGTERM");
}
