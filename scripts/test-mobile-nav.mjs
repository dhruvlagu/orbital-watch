import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = join(projectRoot, "node_modules", "vite", "bin", "vite.js");
const localChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const routes = ["/", "/physics", "/collision-watch"];

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
    return puppeteer.launch({
      executablePath: localChromePath,
      headless: true,
      defaultViewport: { width: 375, height: 667, deviceScaleFactor: 1 },
    });
  }

  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: await chromium.executablePath(),
    headless: "shell",
    defaultViewport: { width: 375, height: 667, deviceScaleFactor: 1 },
  });
}

async function testRoute(page, route) {
  console.log(`\n=== Testing route: ${route} ===`);
  
  const consoleMessages = [];
  const pageErrors = [];
  
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.toLowerCase().includes('hydrat') || 
        text.toLowerCase().includes('react') ||
        text.toLowerCase().includes('error')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });
  
  page.on('pageerror', (err) => {
    pageErrors.push(err);
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle0" });
  
  // Wait for page to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try to click the hamburger menu button
  const menuButton = await page.$('button[aria-label="Open menu"]');
  if (!menuButton) {
    console.log(`❌ Menu button not found on ${route}`);
    return { success: false, consoleMessages, pageErrors };
  }
  
  await menuButton.click();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if mobile nav exists
  const mobileNav = await page.$('#mobileNav');
  const mobileNavExists = mobileNav !== null;
  
  console.log(`Mobile nav exists: ${mobileNavExists}`);
  
  // Close mobile nav if it opened
  if (mobileNavExists) {
    const closeButton = await page.$('button[aria-label="Close menu"]');
    if (closeButton) {
      await closeButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { 
    success: mobileNavExists, 
    consoleMessages, 
    pageErrors 
  };
}

async function main() {
  console.log("Starting mobile navigation test...");
  
  let preview;
  let browser;
  
  try {
    preview = await startPreviewServer();
    console.log("Server started, launching browser...");
    
    browser = await launchBrowser();
    const page = await browser.newPage();
  
    const results = {};
    
    for (const route of routes) {
      try {
        results[route] = await testRoute(page, route);
      } catch (err) {
        console.error(`Error testing ${route}:`, err);
        results[route] = { success: false, error: err.message };
      }
    }
    
    console.log("\n=== SUMMARY ===");
    for (const route of routes) {
      const result = results[route];
      console.log(`${route}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      if (result.pageErrors && result.pageErrors.length > 0) {
        console.log(`  Page errors: ${result.pageErrors.length}`);
      }
      if (result.consoleMessages && result.consoleMessages.length > 0) {
        const hydrationErrors = result.consoleMessages.filter(m => 
          m.toLowerCase().includes('hydrat')
        );
        if (hydrationErrors.length > 0) {
          console.log(`  Hydration errors: ${hydrationErrors.length}`);
        }
      }
    }
  } finally {
    await browser?.close();
    preview?.kill("SIGTERM");
  }
  
  process.exit(0);
}

main().catch(console.error);
