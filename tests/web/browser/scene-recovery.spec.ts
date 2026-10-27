import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// Context restoration and two software-rendered captures share this total test budget.
test.setTimeout(60_000);

async function sampleSceneColor(page: Page): Promise<number[]> {
  return page.evaluate(() => new Promise<number[]>((resolve, reject) => {
    requestAnimationFrame(() => {
      const canvas = document.querySelector<HTMLCanvasElement>("#world");
      const context = canvas?.getContext("webgl2");
      if (!canvas || !context) { reject(new Error("The scene must have a WebGL2 context")); return; }
      // Read in the render animation frame, before the browser clears a non-preserved drawing buffer.
      // Sample the central case, where wood, metal and foliage depend on the generated environment.
      const x = Math.floor(canvas.width * 0.25), y = Math.floor(canvas.height * 0.35);
      const width = Math.floor(canvas.width * 0.5), height = Math.floor(canvas.height * 0.4);
      const pixels = new Uint8Array(width * height * 4);
      context.readPixels(x, y, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
      const channels = [0, 0, 0];
      for (let index = 0; index < pixels.length; index += 4) {
        channels[0]! += pixels[index]!;
        channels[1]! += pixels[index + 1]!;
        channels[2]! += pixels[index + 2]!;
      }
      resolve(channels.map(value => value / (width * height)));
    });
  }));
}

test("restoring a context also restores generated lighting, not just frame delivery", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/?capture=1");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized && window.__TIN_DIAGNOSTICS__.loaded, undefined, { timeout: 30_000 });
  const initial = await page.evaluate(() => ({ distance: window.__TIN_DIAGNOSTICS__!.trainDistance, speed: window.__TIN_DIAGNOSTICS__!.trainSpeed }));
  expect(initial.speed).toBe(0);
  const before = await sampleSceneColor(page);
  expect(before.every(channel => channel > 20 && channel < 250)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("lighting-before-loss.png") });

  await page.evaluate(() => {
    const context = document.querySelector<HTMLCanvasElement>("#world")!.getContext("webgl2")!;
    const extension = context.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("The graphics runtime must support context loss testing");
    Reflect.set(window, "__lightingTestContext", extension);
    extension.loseContext();
  });
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.contextLosses === 1 && window.__TIN_DIAGNOSTICS__.lifecycle === "paused", undefined, { timeout: 30_000 });
  const frames = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.frameCount);
  await page.evaluate(() => Reflect.get(window, "__lightingTestContext").restoreContext());
  await page.waitForFunction(previous => window.__TIN_DIAGNOSTICS__!.frameCount > previous && window.__TIN_DIAGNOSTICS__!.lifecycle === "running", frames, { timeout: 30_000 });

  const after = await sampleSceneColor(page);
  for (let channel = 0; channel < 3; channel++) {
    // The original missing-PMREM bug visibly darkened the entire case. Allow only minor GPU noise.
    expect(Math.abs(after[channel]! - before[channel]!)).toBeLessThan(1);
  }
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.trainDistance)).toBe(initial.distance);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("lighting-after-restore.png") });
});
