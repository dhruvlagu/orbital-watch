import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const MAX_DEBRIS_COUNTS = [100, 150, 200, 300];
const MAX_DEBRIS_TO_CHECKS = [25, 50, 75, 100];
const THROTTLE_RATES = [1, 4];
const RUNS_PER_COMBO = 2;
const MAX_DURATION_MS = 20000;

const results = [];

async function runBenchmark(config) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set CPU throttling via CDP
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: config.throttleRate });

  try {
    const url = `file://${path.join(process.cwd(), 'bench', 'bench.html')}?maxDebrisCount=${config.maxDebrisCount}&maxDebrisToCheck=${config.maxDebrisToCheck}&useRotatingWindow=${config.useRotatingWindow}&throttleRate=${config.throttleRate}`;
    await page.goto(url);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Wait for the Run button to be available
    await page.waitForSelector('button:has-text("Run Cascade")', { state: 'visible', timeout: 5000 });

    const runResults = [];

    for (let run = 0; run < RUNS_PER_COMBO; run++) {
      // Reset first
      await page.click('button:has-text("Reset")');
      await page.waitForTimeout(100);

      // Start cascade
      const startTime = Date.now();
      await page.click('button:has-text("Run Cascade")');

      // Wait for completion or timeout
      await page.waitForFunction(
        () => {
          const status = document.querySelector('p:nth-of-type(2)');
          return status && status.textContent?.includes('Complete:');
        },
        { timeout: MAX_DURATION_MS }
      ).catch(() => {
        // Timeout is okay, we'll read whatever metrics are available
      });

      const elapsed = Date.now() - startTime;

      // Extract metrics
      const metrics = await page.evaluate(() => {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv || resultsDiv.style.display === 'none') return null;

        const paragraphs = resultsDiv.querySelectorAll('p');
        const metrics = {};

        for (const p of paragraphs) {
          const text = p.textContent;
          const match = text.match(/(.+?): (.+)/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();

            if (key === 'Total frames') {
              metrics.totalFrames = parseInt(value);
            } else if (key === 'Avg frame time') {
              metrics.avgFrameTime = parseFloat(value);
            } else if (key === 'P95 frame time') {
              metrics.p95FrameTime = parseFloat(value);
            } else if (key === 'Frames over 16.7ms') {
              metrics.framesOver16ms = parseFloat(value);
            } else if (key === 'Frames over 33ms') {
              metrics.framesOver33ms = parseFloat(value);
            } else if (key === 'Final object count') {
              metrics.finalObjectCount = parseInt(value);
            } else if (key === 'Total collisions') {
              metrics.totalCollisions = parseInt(value);
            } else if (key === 'Missed collisions') {
              const missedMatch = value.match(/(\d+)/);
              metrics.missedCollisions = missedMatch ? parseInt(missedMatch[1]) : 0;
            }
          }
        }

        return metrics;
      });

      if (metrics) {
        runResults.push({
          ...metrics,
          elapsed,
          run: run + 1,
        });
      }

      await page.waitForTimeout(500);
    }

    return runResults;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('Starting Kessler simulation benchmark...');
  console.log('Note: Make sure dev server is running on http://localhost:5173\n');

  // First, test all combinations
  for (const maxDebrisCount of MAX_DEBRIS_COUNTS) {
    for (const maxDebrisToCheck of MAX_DEBRIS_TO_CHECKS) {
      for (const throttleRate of THROTTLE_RATES) {
        console.log(`Testing: maxDebrisCount=${maxDebrisCount}, maxDebrisToCheck=${maxDebrisToCheck}, throttle=${throttleRate}x`);

        const runResults = await runBenchmark({
          maxDebrisCount,
          maxDebrisToCheck,
          useRotatingWindow: false,
          throttleRate,
        });

        // Aggregate results
        const avgMetrics = {
          maxDebrisCount,
          maxDebrisToCheck,
          throttleRate,
          useRotatingWindow: false,
          avgFrameTime: runResults.reduce((sum, r) => sum + r.avgFrameTime, 0) / runResults.length,
          p95FrameTime: runResults.reduce((sum, r) => sum + r.p95FrameTime, 0) / runResults.length,
          framesOver16ms: runResults.reduce((sum, r) => sum + r.framesOver16ms, 0) / runResults.length,
          framesOver33ms: runResults.reduce((sum, r) => sum + r.framesOver33ms, 0) / runResults.length,
          finalObjectCount: runResults.reduce((sum, r) => sum + r.finalObjectCount, 0) / runResults.length,
          totalCollisions: runResults.reduce((sum, r) => sum + r.totalCollisions, 0) / runResults.length,
          missedCollisions: runResults.reduce((sum, r) => sum + r.missedCollisions, 0) / runResults.length,
          totalCollisionsPlusMissed: runResults.reduce((sum, r) => sum + (r.totalCollisions + r.missedCollisions), 0) / runResults.length,
        };

        results.push(avgMetrics);
        console.log(`  Avg frame time: ${avgMetrics.avgFrameTime.toFixed(2)}ms, P95: ${avgMetrics.p95FrameTime.toFixed(2)}ms`);
      }
    }
  }

  // Test rotating window approach at 150 objects
  console.log('\nTesting rotating window approach at 150 objects...');
  for (const maxDebrisToCheck of [50, 100]) {
    for (const throttleRate of [1, 4]) {
      console.log(`Testing: maxDebrisCount=150, maxDebrisToCheck=${maxDebrisToCheck}, rotating=true, throttle=${throttleRate}x`);

      const runResults = await runBenchmark({
        maxDebrisCount: 150,
        maxDebrisToCheck,
        useRotatingWindow: true,
        throttleRate,
      });

      const avgMetrics = {
        maxDebrisCount: 150,
        maxDebrisToCheck,
        throttleRate,
        useRotatingWindow: true,
        avgFrameTime: runResults.reduce((sum, r) => sum + r.avgFrameTime, 0) / runResults.length,
        p95FrameTime: runResults.reduce((sum, r) => sum + r.p95FrameTime, 0) / runResults.length,
        framesOver16ms: runResults.reduce((sum, r) => sum + r.framesOver16ms, 0) / runResults.length,
        framesOver33ms: runResults.reduce((sum, r) => sum + r.framesOver33ms, 0) / runResults.length,
        finalObjectCount: runResults.reduce((sum, r) => sum + r.finalObjectCount, 0) / runResults.length,
        totalCollisions: runResults.reduce((sum, r) => sum + r.totalCollisions, 0) / runResults.length,
        missedCollisions: runResults.reduce((sum, r) => sum + r.missedCollisions, 0) / runResults.length,
        totalCollisionsPlusMissed: runResults.reduce((sum, r) => sum + (r.totalCollisions + r.missedCollisions), 0) / runResults.length,
      };

      results.push(avgMetrics);
      console.log(`  Avg frame time: ${avgMetrics.avgFrameTime.toFixed(2)}ms, P95: ${avgMetrics.p95FrameTime.toFixed(2)}ms`);
    }
  }

  // Save results to CSV
  const csvPath = path.join(process.cwd(), 'bench', 'results.csv');
  const csvHeader = 'maxDebrisCount,maxDebrisToCheck,throttleRate,useRotatingWindow,avgFrameTime,p95FrameTime,framesOver16ms,framesOver33ms,finalObjectCount,totalCollisions,missedCollisions,totalCollisionsPlusMissed\n';
  const csvRows = results.map(r =>
    `${r.maxDebrisCount},${r.maxDebrisToCheck},${r.throttleRate},${r.useRotatingWindow},${r.avgFrameTime.toFixed(2)},${r.p95FrameTime.toFixed(2)},${r.framesOver16ms.toFixed(1)},${r.framesOver33ms.toFixed(1)},${r.finalObjectCount.toFixed(0)},${r.totalCollisions.toFixed(0)},${r.missedCollisions.toFixed(0)},${r.totalCollisionsPlusMissed?.toFixed(0) || 0}`
  ).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\nResults saved to ${csvPath}`);

  // Print summary table
  console.log('\n=== RESULTS SUMMARY ===\n');
  console.log('Format: maxDebrisCount | maxDebrisToCheck | throttle | avgFrame | p95Frame | %>16ms | %>33ms | missed%');
  console.log(''.padEnd(80, '-'));

  for (const throttleRate of THROTTLE_RATES) {
    console.log(`\nThrottle: ${throttleRate}x`);
    for (const maxDebrisCount of MAX_DEBRIS_COUNTS) {
      for (const maxDebrisToCheck of MAX_DEBRIS_TO_CHECKS) {
        const result = results.find(r =>
          r.maxDebrisCount === maxDebrisCount &&
          r.maxDebrisToCheck === maxDebrisToCheck &&
          r.throttleRate === throttleRate &&
          !r.useRotatingWindow
        );
        if (result) {
          const missedPercent = result.totalCollisions > 0
            ? ((result.missedCollisions / (result.totalCollisions + result.missedCollisions)) * 100).toFixed(1)
            : '0.0';
          console.log(
            `${maxDebrisCount.toString().padEnd(18)} | ${maxDebrisToCheck.toString().padEnd(16)} | ${throttleRate.toString().padEnd(7)} | ${result.avgFrameTime.toFixed(2).padEnd(8)} | ${result.p95FrameTime.toFixed(2).padEnd(8)} | ${result.framesOver16ms.toFixed(1).padEnd(6)}% | ${result.framesOver33ms.toFixed(1).padEnd(6)}% | ${missedPercent.padEnd(7)}%`
          );
        }
      }
    }
  }

  // Print rotating window comparison
  console.log('\n=== ROTATING WINDOW COMPARISON (150 objects) ===\n');
  console.log('maxDebrisToCheck | throttle | avgFrame | p95Frame | %>16ms | %>33ms | missed%');
  console.log(''.padEnd(70, '-'));

  for (const throttleRate of [1, 4]) {
    for (const maxDebrisToCheck of [50, 100]) {
      const normal = results.find(r =>
        r.maxDebrisCount === 150 &&
        r.maxDebrisToCheck === maxDebrisToCheck &&
        r.throttleRate === throttleRate &&
        !r.useRotatingWindow
      );
      const rotating = results.find(r =>
        r.maxDebrisCount === 150 &&
        r.maxDebrisToCheck === maxDebrisToCheck &&
        r.throttleRate === throttleRate &&
        r.useRotatingWindow
      );

      if (normal && rotating) {
        const normalMissed = normal.totalCollisions + normal.missedCollisions > 0
          ? ((normal.missedCollisions / (normal.totalCollisions + normal.missedCollisions)) * 100).toFixed(1)
          : '0.0';
        const rotatingMissed = rotating.totalCollisions + rotating.missedCollisions > 0
          ? ((rotating.missedCollisions / (rotating.totalCollisions + rotating.missedCollisions)) * 100).toFixed(1)
          : '0.0';

        console.log(`Normal: ${maxDebrisToCheck.toString().padEnd(16)} | ${throttleRate.toString().padEnd(7)} | ${normal.avgFrameTime.toFixed(2).padEnd(8)} | ${normal.p95FrameTime.toFixed(2).padEnd(8)} | ${normal.framesOver16ms.toFixed(1).padEnd(6)}% | ${normal.framesOver33ms.toFixed(1).padEnd(6)}% | ${normalMissed.padEnd(7)}%`);
        console.log(`Rotate: ${maxDebrisToCheck.toString().padEnd(16)} | ${throttleRate.toString().padEnd(7)} | ${rotating.avgFrameTime.toFixed(2).padEnd(8)} | ${rotating.p95FrameTime.toFixed(2).padEnd(8)} | ${rotating.framesOver16ms.toFixed(1).padEnd(6)}% | ${rotating.framesOver33ms.toFixed(1).padEnd(6)}% | ${rotatingMissed.padEnd(7)}%`);
        console.log('');
      }
    }
  }

  // Find safe combinations
  console.log('\n=== SAFE COMBINATIONS ===\n');
  console.log('Safe: p95 < 33ms at 4x throttle, p95 < 16.7ms at 1x throttle\n');

  const safe4x = results.filter(r =>
    r.throttleRate === 4 &&
    r.p95FrameTime < 33 &&
    !r.useRotatingWindow
  ).sort((a, b) => b.maxDebrisCount - a.maxDebrisCount);

  const safe1x = results.filter(r =>
    r.throttleRate === 1 &&
    r.p95FrameTime < 16.7 &&
    !r.useRotatingWindow
  ).sort((a, b) => b.maxDebrisCount - a.maxDebrisCount);

  if (safe4x.length > 0) {
    console.log('Largest safe combination at 4x throttle:');
    const best4x = safe4x[0];
    console.log(`  maxDebrisCount: ${best4x.maxDebrisCount}, maxDebrisToCheck: ${best4x.maxDebrisToCheck}, p95: ${best4x.p95FrameTime.toFixed(2)}ms`);
  }

  if (safe1x.length > 0) {
    console.log('\nLargest safe combination at 1x throttle:');
    const best1x = safe1x[0];
    console.log(`  maxDebrisCount: ${best1x.maxDebrisCount}, maxDebrisToCheck: ${best1x.maxDebrisToCheck}, p95: ${best1x.p95FrameTime.toFixed(2)}ms`);
  }

  // Check if current values (150, 50) are safe
  const current150_50_4x = results.find(r =>
    r.maxDebrisCount === 150 &&
    r.maxDebrisToCheck === 50 &&
    r.throttleRate === 4 &&
    !r.useRotatingWindow
  );

  const current150_50_1x = results.find(r =>
    r.maxDebrisCount === 150 &&
    r.maxDebrisToCheck === 50 &&
    r.throttleRate === 1 &&
    !r.useRotatingWindow
  );

  console.log('\n=== CURRENT VALUES (150, 50) ===\n');
  if (current150_50_4x) {
    const safe4x = current150_50_4x.p95FrameTime < 33;
    console.log(`4x throttle: p95 = ${current150_50_4x.p95FrameTime.toFixed(2)}ms ${safe4x ? '✅ SAFE' : '❌ NOT SAFE (target: <33ms)'}`);
    console.log(`  Headroom: ${(33 - current150_50_4x.p95FrameTime).toFixed(2)}ms`);
  }

  if (current150_50_1x) {
    const safe1x = current150_50_1x.p95FrameTime < 16.7;
    console.log(`1x throttle: p95 = ${current150_50_1x.p95FrameTime.toFixed(2)}ms ${safe1x ? '✅ SAFE' : '❌ NOT SAFE (target: <16.7ms)'}`);
    console.log(`  Headroom: ${(16.7 - current150_50_1x.p95FrameTime).toFixed(2)}ms`);
  }

  // Compare quality at 150 objects with different window sizes
  console.log('\n=== QUALITY COMPARISON AT 150 OBJECTS ===\n');
  console.log('maxDebrisToCheck | missed% (1x) | missed% (4x)');
  console.log(''.padEnd(40, '-'));

  for (const maxDebrisToCheck of [50, 100, 'all']) {
    const result1x = results.find(r =>
      r.maxDebrisCount === 150 &&
      r.maxDebrisToCheck === maxDebrisToCheck &&
      r.throttleRate === 1 &&
      !r.useRotatingWindow
    );
    const result4x = results.find(r =>
      r.maxDebrisCount === 150 &&
      r.maxDebrisToCheck === maxDebrisToCheck &&
      r.throttleRate === 4 &&
      !r.useRotatingWindow
    );

    if (result1x && result4x) {
      const missed1x = result1x.totalCollisions + result1x.missedCollisions > 0
        ? ((result1x.missedCollisions / (result1x.totalCollisions + result1x.missedCollisions)) * 100).toFixed(1)
        : '0.0';
      const missed4x = result4x.totalCollisions + result4x.missedCollisions > 0
        ? ((result4x.missedCollisions / (result4x.totalCollisions + result4x.missedCollisions)) * 100).toFixed(1)
        : '0.0';

      console.log(`${maxDebrisToCheck.toString().padEnd(18)} | ${missed1x.padEnd(11)}% | ${missed4x.padEnd(11)}%`);
    }
  }

  console.log('\n=== MEASUREMENT LIMITATIONS ===\n');
  console.log('- Headless Chromium may not match real browser rendering performance');
  console.log('- Single machine (macOS) - results may vary on Windows/Linux');
  console.log('- CPU throttling is an approximation of real device performance');
  console.log('- Canvas rendering in headless mode may differ from visible canvas');
  console.log('- 2.5s cascade duration may not represent longer-running simulations');
}

main().catch(console.error);
