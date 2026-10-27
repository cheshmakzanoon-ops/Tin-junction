import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

test.setTimeout(60_000);

async function deliver(page: Page, type: string, payload: Record<string, unknown>): Promise<void> {
  await page.evaluate(message => window.TinJunction?.receiveNative(message), { version: 1, id: "interaction-test", type, payload });
}

async function openWorkbench(page: Page): Promise<void> {
  await page.goto("/?capture=1");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized && window.__TIN_DIAGNOSTICS__.loaded);
}

async function nextFrames(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

for (const interruption of ["native viewport", "native inactive", "document hidden", "canvas resize"] as const) {
  test(`an interrupted editor tap cannot place scenery after ${interruption}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openWorkbench(page);
    await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
    await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
    const before = await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }));
    await page.mouse.move(650, 410);
    await page.mouse.down();
    if (interruption === "native viewport") {
      await deliver(page, "native.viewport", { width: 1280, height: 900, pixelRatio: 1, hingeAngleDegrees: 120 });
    } else if (interruption === "native inactive") {
      await deliver(page, "native.lifecycle", { state: "inactive" });
      await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.lifecycle)).toBe("paused");
      await deliver(page, "native.lifecycle", { state: "active" });
    } else if (interruption === "document hidden") {
      // Exercise the visibility listener without pretending this is a physical
      // app switch or device-level touch cancellation test.
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.lifecycle)).toBe("paused");
      await page.evaluate(() => {
        Reflect.deleteProperty(document, "hidden");
        document.dispatchEvent(new Event("visibilitychange"));
      });
    } else {
      await page.setViewportSize({ width: 1270, height: 890 });
      await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.width === 1270 && window.__TIN_DIAGNOSTICS__!.height === 890);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.width === 1280 && window.__TIN_DIAGNOSTICS__!.height === 900);
    }
    await page.mouse.up();
    await nextFrames(page);
    expect(await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }))).toEqual(before);
    // The same spot must still accept a fresh intentional tap after recovery.
    await page.mouse.click(650, 410);
    await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before.scenery + 1);
  });
}

test("a fresh touch can place scenery after an interrupted touch is canceled", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openWorkbench(page);
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
  const before = await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }));
  // Chromium touch delivery verifies the pointer button/identity path. It does
  // not certify physical iPhone touch handling or native accessibility.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 650, y: 410, id: 1 }] });
  await deliver(page, "native.viewport", { width: 1280, height: 900, pixelRatio: 1, hingeAngleDegrees: 120 });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await nextFrames(page);
  expect(await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }))).toEqual(before);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 650, y: 410, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before.scenery + 1);
});

for (const gesture of ["drag away and return", "right click", "middle click", "Control click", "Meta click", "Shift click"] as const) {
  test(`camera input cannot place scenery after ${gesture}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openWorkbench(page);
    await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
    await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
    const before = await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }));
    if (gesture === "drag away and return") {
      await page.mouse.move(650, 410);
      await page.mouse.down();
      await page.mouse.move(680, 410, { steps: 2 });
      await page.mouse.move(650, 410, { steps: 2 });
      await page.mouse.up();
    } else if (gesture === "Control click" || gesture === "Meta click" || gesture === "Shift click") {
      const modifier = gesture.split(" ")[0]!;
      await page.keyboard.down(modifier);
      await page.mouse.click(650, 410);
      await page.keyboard.up(modifier);
    } else await page.mouse.click(650, 410, { button: gesture === "right click" ? "right" : "middle" });
    await nextFrames(page);
    expect(await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }))).toEqual(before);
    await page.mouse.click(650, 410);
    await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before.scenery + 1);
  });
}

test("pressing and releasing a camera modifier cancels an already held editor tap", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openWorkbench(page);
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
  const before = await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }));
  await page.mouse.move(650, 410);
  await page.mouse.down();
  // All pointer events retain the same position and the release has no modifier.
  // Observing only pointer-up flags would incorrectly commit this camera gesture.
  await page.keyboard.down("Shift");
  await page.keyboard.up("Shift");
  await page.mouse.up();
  await nextFrames(page);
  expect(await page.evaluate(() => ({ scenery: window.__TIN_DIAGNOSTICS__!.sceneryCount, revision: window.__TIN_DIAGNOSTICS__!.revision }))).toEqual(before);
  await page.mouse.click(650, 410);
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before.scenery + 1);
});

async function usableTarget(locator: Locator, page: Page): Promise<void> {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(44);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  expect(await locator.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit === node || (hit !== null && node.contains(hit));
  })).toBe(true);
}

for (const viewport of [
  { width: 1100, height: 760, native: false },
  { width: 382, height: 575, native: true },
  { width: 358, height: 300, native: true },
  { width: 844, height: 390, native: false },
]) {
  test(`an 80-character railway name leaves controls clear at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    if (viewport.native) {
      // A browser bridge fixture exercises the packaged-host layout. This is
      // deliberately not evidence of native accessibility or device geometry.
      await page.addInitScript(() => {
        window.webkit = { messageHandlers: { tinJunction: { postMessage: message => {
          if (message.type !== "layout.checkpoint") return;
          const payload = message.payload as { sessionId: string; requestId: string; document: { documentId: string; revision: number }; checkpoint: number };
          queueMicrotask(() => window.TinJunction?.receiveNative({ version: 1, id: "test-ack", type: "native.saved", payload: {
            sessionId: payload.sessionId, requestId: payload.requestId, documentId: payload.document.documentId,
            revision: payload.document.revision, checkpoint: payload.checkpoint, checksum: "a".repeat(64),
          } }));
        } } } };
      });
      await page.goto("/?capture=1");
      await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized);
      await deliver(page, "native.bootstrap", { host: "ios", debug: false, sessionId: "interaction-layout" });
      await deliver(page, "native.layout", { sessionId: "interaction-layout", document: null, recovered: false, checkpoint: 0 });
      await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.loaded);
    } else await openWorkbench(page);
    const name = "W".repeat(80);
    await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Layout name", exact: true });
    await input.fill(name);
    await input.press("Tab");
    await page.getByRole("button", { name: "Close scenery workshop", exact: true }).click();
    const title = page.getByRole("heading", { name, exact: true });
    await expect(title).toBeVisible();
    await expect(title).toHaveAccessibleName(name);
    expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.documentName)).toBe(name);
    // Keep the actual name in the DOM/accessibility tree; only the visual title
    // may be clipped. Its painted text box must not extend under scene controls.
    const bounds = await title.boundingBox();
    const controls = await page.locator(".view-tools").boundingBox();
    expect(bounds).not.toBeNull();
    expect(controls).not.toBeNull();
    await page.screenshot({ path: testInfo.outputPath("maximum-name.png") });
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(controls!.y > bounds!.y ? controls!.y : controls!.y + controls!.height);
    const overlapsControls = bounds!.x < controls!.x + controls!.width && bounds!.x + bounds!.width > controls!.x
      && bounds!.y < controls!.y + controls!.height && bounds!.y + bounds!.height > controls!.y;
    expect(overlapsControls).toBe(false);
    const clipping = await title.evaluate(node => ({
      overflowX: getComputedStyle(node).overflowX, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
      height: node.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(node).lineHeight),
    }));
    expect(clipping.height).toBeLessThanOrEqual(clipping.lineHeight * 2 + 1);
    if (clipping.scrollWidth > clipping.clientWidth) expect(clipping.overflowX).toBe("hidden");
    for (const name of ["Daylight", "Evening", "Night", "Overview camera", "Trackside camera", "Overhead camera", "Stop train", "Arrange scenery"]) {
      await usableTarget(page.getByRole("button", { name, exact: true }), page);
    }
    if (!viewport.native) await usableTarget(page.getByRole("button", { name: "Save layout", exact: true }), page);
  });
}

test("Save remains readable against every canvas background", async ({ page }, testInfo) => {
  await openWorkbench(page);
  const save = page.getByRole("button", { name: "Save layout", exact: true });
  for (const time of ["Daylight", "Evening", "Night"]) {
    await page.getByRole("button", { name: time, exact: true }).click();
    const colors = await save.evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
    const rgba = (color: string): number[] => color.match(/[\d.]+/g)!.map(Number);
    const [red, green, blue, alpha = 1] = rgba(colors.background);
    const luminance = (channels: number[]): number => channels.slice(0, 3).map(value => value / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index]!, 0);
    const foreground = luminance(rgba(colors.color));
    // Check both extreme possible scene colors. A transparent control cannot
    // guarantee readable status text over the moving dark case and bright sky.
    for (const underlay of [0, 255]) {
      const background = luminance([red!, green!, blue!].map(channel => alpha * channel + (1 - alpha) * underlay));
      expect((Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)).toBeGreaterThanOrEqual(4.5);
    }
    await usableTarget(save, page);
    await page.screenshot({ path: testInfo.outputPath(`save-${time.toLowerCase()}.png`) });
  }
});
