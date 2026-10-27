import { expect, test } from "@playwright/test";

test("offline bundle renders the operating miniature with no external requests", async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (!request.url().startsWith("http://127.0.0.1:4173/") && !request.url().startsWith("data:")) external.push(request.url()); });
  await page.goto("/?capture=1");
  await expect(page.getByRole("heading", { name: "Tin Junction.", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run train", exact: true })).toBeVisible();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized === true);
  const info = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!);
  expect(info.renderer).toBe("webgl2");
  expect(info.frameCount).toBeGreaterThan(0);
  expect(info.drawingBufferWidth * info.drawingBufferHeight).toBeLessThanOrEqual(2_000_000);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.screenshot({ path: "test-results/first-railway-overview.png" });
});

test("bridge validation, lifecycle pause/resume and resize are observable", async ({ page }) => {
  await page.goto("/?capture=1");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized === true);
  await page.evaluate(() => {
    window.TinJunction?.receiveNative({ version: 999, id: "bad", type: "eval", payload: {} });
    window.TinJunction?.receiveNative({ version: 1, id: "pause", type: "native.lifecycle", payload: { state: "background" } });
  });
  const paused = await page.evaluate(() => ({ ...window.__TIN_DIAGNOSTICS__! }));
  expect(paused.rejectedMessages).toBe(1);
  expect(paused.lifecycle).toBe("paused");
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.frameCount)).toBe(paused.frameCount);
  await page.evaluate(() => window.TinJunction?.receiveNative({ version: 1, id: "resume", type: "native.lifecycle", payload: { state: "active" } }));
  await page.waitForFunction((frames) => window.__TIN_DIAGNOSTICS__!.frameCount > frames, paused.frameCount);
  await page.setViewportSize({ width: 600, height: 500 });
  await expect.poll(() => page.evaluate(() => ({
    width: window.__TIN_DIAGNOSTICS__!.width,
    height: window.__TIN_DIAGNOSTICS__!.height,
  })), { timeout: 10_000 }).toEqual({ width: 600, height: 500 });
});

test("WebGL context loss pauses and restoration resumes the same harness", async ({ page }) => {
  await page.goto("/?capture=1");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized === true);
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
    const extension = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("The test renderer must support explicit context loss");
    Reflect.set(window, "__testContextLoss", extension);
    extension.loseContext();
  });
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.contextLosses === 1 && window.__TIN_DIAGNOSTICS__?.lifecycle === "paused");
  const frames = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.frameCount);
  await page.evaluate(() => Reflect.get(window, "__testContextLoss").restoreContext());
  await page.waitForFunction((previous) => window.__TIN_DIAGNOSTICS__!.frameCount > previous && window.__TIN_DIAGNOSTICS__!.lifecycle === "running", frames);
});
