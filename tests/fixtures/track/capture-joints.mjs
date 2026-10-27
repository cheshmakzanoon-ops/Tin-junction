import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

// Run from repository root. Local engineering capture, never device-performance evidence.
const output = resolve('test-results/track-joints');
await mkdir(output, { recursive: true });
const server = await createServer({ configFile: false, root: process.cwd(), server: { host: '127.0.0.1', port: 4187, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1050 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4187/tests/fixtures/track/joints.html');
  await page.waitForFunction(() => window.__TRACK_FIXTURE__?.length === 4);
  const results = await page.evaluate(() => window.__TRACK_FIXTURE__);
  if (errors.length || results.some(result => !result.compatible || result.triangles <= 0)) throw new Error(JSON.stringify({ errors, results }));
  await page.screenshot({ path: resolve(output, 'joints.png'), fullPage: true });
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ environment: 'Desktop Chromium with SwiftShader; not physical device evidence', results, errors }, null, 2));
  console.log(`Captured four actual geometry views in ${output}`);
} finally {
  await browser?.close();
  await server.close();
}
