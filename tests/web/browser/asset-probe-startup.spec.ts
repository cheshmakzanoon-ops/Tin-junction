import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildWeb } from "../../../tools/build-web.mjs";

// Exercise the actual diagnostic bundle without replacing the ordinary preview
// or claiming browser transport to be WKWebView/custom-origin evidence.
let directory: string;
const files = new Map<string, Buffer>();
const prefix = "/__asset-probe-startup__/";

test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "tin-asset-probe-startup-"));
  const manifest = await buildWeb({ assetProbe: true, outputDirectory: directory });
  for (const filename of Object.keys(manifest.artifacts)) files.set(filename, await readFile(join(directory, filename)));
});
test.afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

async function openNativeHarness(page: Page): Promise<void> {
  await page.route(`**${prefix}**`, async route => {
    const filename = new URL(route.request().url()).pathname.slice(prefix.length);
    const body = files.get(filename);
    const contentType = filename.endsWith(".js") ? "text/javascript" : filename.endsWith(".css") ? "text/css"
      : filename.endsWith(".html") ? "text/html" : filename.endsWith(".png") ? "image/png"
        : filename.endsWith(".wav") ? "audio/wav" : "application/octet-stream";
    await route.fulfill({ status: body ? 200 : 404, contentType, body: body ?? "Missing fixture" });
  });
  await page.addInitScript(() => {
    Reflect.set(window, "__probeStartupEvents", []);
    window.webkit = { messageHandlers: { tinJunction: { postMessage(message) {
      Reflect.get(window, "__probeStartupEvents").push({
        message,
        layoutCallbackReturned: Reflect.get(window, "__layoutCallbackReturned") === true,
        layoutMicrotasksFlushed: Reflect.get(window, "__layoutMicrotasksFlushed") === true,
      });
    } } } };
  });
  await page.goto(`${prefix}index.html`);
  await page.waitForFunction(() => Reflect.get(window, "__probeStartupEvents").some(
    (event: { message: { type: string } }) => event.message.type === "web.ready"), undefined, { timeout: 30_000 });
}

async function settleFrames(page: Page): Promise<void> {
  // A real event-loop boundary, without guessing a wall-clock sleep duration.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test("diagnostic renderer waits for applied layout and the completed receive callback", async ({ page }) => {
  test.setTimeout(60_000);
  await openNativeHarness(page);
  await page.evaluate(() => window.TinJunction!.receiveNative({
    version: 1, id: "bootstrap-order", type: "native.bootstrap",
    payload: { host: "ios", debug: true, assetProbe: true, sessionId: "probe-order-session" },
  }));
  await settleFrames(page);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.loaded)).toBe(false);
  await expect(page.locator("#asset-origin-probe-panel")).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "__probeStartupEvents").filter(
    (event: { message: { type: string } }) => event.message.type === "engine.assetProbe"))).toEqual([]);

  await page.evaluate(() => {
    Reflect.set(window, "__layoutCallbackReturned", false);
    Reflect.set(window, "__layoutMicrotasksFlushed", false);
    window.TinJunction!.receiveNative({ version: 1, id: "layout-order", type: "native.layout",
      payload: { sessionId: "probe-order-session", document: null, checkpoint: 0, recovered: false } });
    Reflect.set(window, "__layoutCallbackReturned", true);
    queueMicrotask(() => Reflect.set(window, "__layoutMicrotasksFlushed", true));
  });
  await page.waitForFunction(() => Reflect.get(window, "__probeStartupEvents").some(
    (event: { message: { type: string } }) => event.message.type === "engine.assetProbe"), undefined, { timeout: 15_000 });
  const events = await page.evaluate(() => Reflect.get(window, "__probeStartupEvents")) as {
    message: { type: string; payload: { sessionId?: string } }; layoutCallbackReturned: boolean; layoutMicrotasksFlushed: boolean;
  }[];
  const layoutIndex = events.findIndex(event => event.message.type === "layout.loaded");
  expect(layoutIndex).toBeGreaterThanOrEqual(0);
  for (const [index, event] of events.entries()) {
    if (event.message.type !== "engine.assetProbe") continue;
    expect(index).toBeGreaterThan(layoutIndex);
    expect(event.message.payload.sessionId).toBe("probe-order-session");
    expect(event.layoutCallbackReturned).toBe(true);
    expect(event.layoutMicrotasksFlushed).toBe(true);
  }
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.loaded)).toBe(true);
  await expect(page.locator("#asset-origin-probe-panel")).toHaveCount(1);
});

test("a new bootstrap cancels both an unapplied request and an already scheduled diagnostic", async ({ page }) => {
  test.setTimeout(60_000);
  await openNativeHarness(page);
  await page.evaluate(() => {
    const receive = window.TinJunction!.receiveNative;
    const bootstrap = (sessionId: string, enabled: boolean) => receive({ version: 1, id: `bootstrap-${sessionId}`,
      type: "native.bootstrap", payload: { host: "ios", debug: true, assetProbe: enabled, sessionId } });
    const layout = (sessionId: string) => receive({ version: 1, id: `layout-${sessionId}`, type: "native.layout",
      payload: { sessionId, document: null, checkpoint: 0, recovered: false } });
    bootstrap("unapplied-request", true);
    bootstrap("disabled-request", false);
    layout("disabled-request");
  });
  await settleFrames(page);
  await expect(page.locator("#asset-origin-probe-panel")).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "__probeStartupEvents").filter(
    (event: { message: { type: string } }) => event.message.type === "engine.assetProbe"))).toEqual([]);

  await page.evaluate(() => {
    const receive = window.TinJunction!.receiveNative;
    const bootstrap = (sessionId: string, enabled: boolean) => receive({ version: 1, id: `bootstrap-${sessionId}`,
      type: "native.bootstrap", payload: { host: "ios", debug: true, assetProbe: enabled, sessionId } });
    const layout = (sessionId: string) => receive({ version: 1, id: `layout-${sessionId}`, type: "native.layout",
      payload: { sessionId, document: null, checkpoint: 0, recovered: false } });
    bootstrap("scheduled-request", true);
    layout("scheduled-request");
    // The next native session arrives before the scheduled macrotask/import.
    bootstrap("replacement-session", false);
    layout("replacement-session");
  });
  await settleFrames(page);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.loaded)).toBe(true);
  await expect(page.locator("#asset-origin-probe-panel")).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "__probeStartupEvents").filter(
    (event: { message: { type: string } }) => event.message.type === "engine.assetProbe"))).toEqual([]);
});
