import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = resolve('test-results/routed-vehicles');
await mkdir(output, { recursive: true });
const server = await createServer({ configFile: false, root: process.cwd(), server: { host: '127.0.0.1', port: 4188, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1320, height: 1040 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4188/tests/fixtures/track/vehicles.html');
  await page.waitForFunction(() => window.__VEHICLE_FIXTURE__?.results.length === 6, { timeout: 30000 });
  const report = await page.evaluate(() => window.__VEHICLE_FIXTURE__);
  if (errors.length || !report.switchBlocked || report.reversalError > 1e-9 || report.results.some(view => view.missedRailContacts || view.maximumWheelContactError > 1e-8 || view.maximumCouplerGapError > 1e-8 || view.maximumCouplerAngleDegrees > 60 || view.triangles <= 0)) throw new Error(JSON.stringify({ report, errors }));
  await page.screenshot({ path: resolve(output, 'inspection.png'), fullPage: true });
  for (const view of report.results) await page.locator(`#${view.id}`).screenshot({ path: resolve(output, `${view.id}.png`) });
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ ...report, errors }, null, 2));
  console.log(JSON.stringify({ output, errors, switchBlocked: report.switchBlocked, reversalError: report.reversalError, views: report.results }, null, 2));
} finally {
  await browser?.close(); await server.close();
}
