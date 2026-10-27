import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { LayoutDocument } from "../../../web/src/model";
import { BROWSER_BACKUP_KEY, BROWSER_SAVE_KEY } from "../../../web/src/persistence";

test.setTimeout(60_000);
async function openRailway(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized && window.__TIN_DIAGNOSTICS__?.loaded);
}
async function rename(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  await page.getByRole("textbox", { name: "Layout name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Layout name", exact: true }).press("Tab");
  await expect(page.getByRole("heading", { name, exact: true })).toHaveText(name);
  await page.getByRole("button", { name: "Close scenery workshop", exact: true }).click();
}

test("drive, brake and safely reverse the actual train controls", async ({ page }) => {
  await openRailway(page);
  const start = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.trainDistance);
  await page.getByRole("button", { name: "Run train", exact: true }).click();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.trainSpeed > 0.015);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.trainDistance)).not.toBe(start);
  await page.getByRole("button", { name: "Reverse direction", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(/stop|stationary/i);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.direction)).toBe(1);
  await page.getByRole("button", { name: "Stop train", exact: true }).click();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.trainSpeed === 0 && window.__TIN_DIAGNOSTICS__!.throttle === 0);
  await page.getByRole("button", { name: "Reverse direction", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.direction)).toBe(-1);
  await page.getByRole("button", { name: "Run train", exact: true }).click();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.trainSpeed > 0.01);
  await page.getByRole("button", { name: "Pause train", exact: true }).click();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.trainSpeed === 0);
});

test("place scenery on the board and undo/redo one complete transaction", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openRailway(page);
  const before = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount);
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
  await page.locator("#world").click({ position: { x: 650, y: 410 } });
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before + 1);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.trainSpeed)).toBe(0);
  await page.getByRole("button", { name: "Undo edit", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before);
  await page.getByRole("button", { name: "Redo edit", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before + 1);
  await page.screenshot({ path: "test-results/first-railway-scenery-workshop.png" });
});

test("name, light and reopen a saved layout with the train stopped", async ({ page }) => {
  await openRailway(page);
  await rename(page, "Cedar crossing");
  await page.getByRole("button", { name: "Night", exact: true }).click();
  await page.getByRole("button", { name: "Run train", exact: true }).click();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__!.trainSpeed > 0.01);
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("saved");
  const revision = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.revision);
  await page.reload();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.loaded && window.__TIN_DIAGNOSTICS__?.initialized);
  await expect(page.getByRole("heading", { name: "Cedar crossing", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Night", exact: true })).toHaveAttribute("aria-pressed", "true");
  const restored = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!);
  expect(restored.revision).toBe(revision); expect(restored.trainSpeed).toBe(0); expect(restored.throttle).toBe(0);
  await page.screenshot({ path: "test-results/first-railway-night-restored.png" });
});

test("corrupt current generation restores an identified previous save", async ({ page }) => {
  await openRailway(page);
  await rename(page, "The good afternoon");
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("saved");
  const previous = await page.evaluate(key => localStorage.getItem(key), BROWSER_SAVE_KEY);
  expect(previous).not.toBeNull();
  await page.addInitScript(({ currentKey, previousKey, previousValue }) => {
    localStorage.setItem(currentKey, "damaged-current-fixture");
    localStorage.setItem(previousKey, previousValue!);
  }, { currentKey: BROWSER_SAVE_KEY, previousKey: BROWSER_BACKUP_KEY, previousValue: previous });
  await page.reload();
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.loaded && window.__TIN_DIAGNOSTICS__?.initialized);
  await expect(page.getByRole("heading", { name: "The good afternoon", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("previous good save was restored");
  expect(await page.evaluate(key => localStorage.getItem(key), BROWSER_SAVE_KEY)).toBe("damaged-current-fixture");
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("recovered");
});

type Checkpoint = { sessionId: string; requestId: string; document: LayoutDocument; checkpoint: number; expectedRevision: number | null };
async function checkpoints(page: Page): Promise<Checkpoint[]> {
  return page.evaluate(() => (Reflect.get(window, "__NATIVE_MESSAGES__") as { type: string; payload: Checkpoint }[]).filter(item => item.type === "layout.checkpoint").map(item => item.payload));
}
async function deliver(page: Page, type: string, payload: Record<string, unknown>): Promise<void> {
  await page.evaluate(message => window.TinJunction?.receiveNative(message), { version: 1, id: "native-test", type, payload });
}
async function acknowledge(page: Page, request: Checkpoint, sessionId = "native-session-1"): Promise<void> {
  await deliver(page, "native.saved", { sessionId, requestId: request.requestId, documentId: request.document.documentId, revision: request.document.revision, checkpoint: request.checkpoint, checksum: "a".repeat(64) });
}
test("native bridge queues edits behind a durable acknowledgment and rejects stale sessions", async ({ page }) => {
  // Install before application timers are created, but let the actual renderer
  // initialize normally before pausing. Slow CI clicks must not accidentally
  // cross the production acknowledgment deadline in a pre-deadline assertion.
  // https://playwright.dev/docs/clock#consistent-time-and-timers
  await page.clock.install();
  await page.addInitScript(() => {
    Reflect.set(window, "__NATIVE_MESSAGES__", []);
    Reflect.set(window, "__CHECKPOINT_TIMES__", []);
    window.webkit = { messageHandlers: { tinJunction: { postMessage: message => {
      Reflect.get(window, "__NATIVE_MESSAGES__").push(message);
      if (message.type === "layout.checkpoint") Reflect.get(window, "__CHECKPOINT_TIMES__").push(performance.now());
    } } } };
  });
  await page.goto("/");
  await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 60_000));
  await expect(page.getByRole("button", { name: "Run train", exact: true })).toBeDisabled();
  await deliver(page, "native.bootstrap", { host: "ios", debug: true, sessionId: "native-session-1" });
  await deliver(page, "native.layout", { sessionId: "native-session-1", document: null, recovered: false, checkpoint: 0 });
  await expect.poll(async () => (await checkpoints(page)).length).toBe(1);
  const first = (await checkpoints(page))[0]!;
  expect(first.expectedRevision).toBeNull();
  // The packaged app has native title/save/help controls. Exercise the native
  // save command here instead of a duplicated web-only save button.
  await expect(page.locator(".masthead")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Alpine afternoon", exact: true })).toBeVisible();
  for (let index = 0; index < 24; index += 1) await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-1" });
  expect((await checkpoints(page)).length).toBe(1);
  await rename(page, "A carefully saved railway");
  await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-1" });
  expect((await checkpoints(page)).length).toBe(1);
  // The deadline reports a retryable failure, but never publishes another
  // checkpoint on its own. A deliberate retry must resend the exact immutable
  // request, not assign a new ID/checkpoint or include the queued newer edits.
  // Measure from the intercepted send, rather than assuming no clock ticks
  // elapsed during UI actionability/animation-frame checks.
  const elapsed = await page.evaluate(() => performance.now() - Reflect.get(window, "__CHECKPOINT_TIMES__")[0]);
  expect(elapsed).toBeGreaterThanOrEqual(0);
  expect(elapsed).toBeLessThan(10_000);
  await page.clock.fastForward(9_999 - elapsed);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).not.toBe("failed");
  expect((await checkpoints(page)).length).toBe(1);
  await page.clock.fastForward(1);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("failed");
  expect((await checkpoints(page)).length).toBe(1);
  await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-1" });
  const retried = await checkpoints(page);
  expect(retried).toHaveLength(2);
  expect(retried[1]).toEqual(first);
  for (let index = 0; index < 24; index += 1) await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-1" });
  expect((await checkpoints(page)).length).toBe(2);
  await acknowledge(page, first, "obsolete-session");
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.savedRevision)).toBeNull();
  await acknowledge(page, first);
  await expect.poll(async () => (await checkpoints(page)).length).toBe(3);
  const second = (await checkpoints(page))[2]!;
  expect(second.requestId).not.toBe(first.requestId);
  expect(second.checkpoint).toBe(first.checkpoint + 1);
  expect(second.expectedRevision).toBe(0); expect(second.document.revision).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).not.toBe("saved");
  await acknowledge(page, second);
  await expect.poll(() => page.evaluate(() => window.__TIN_DIAGNOSTICS__!.savedRevision)).toBe(second.document.revision);
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("saved");
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  await deliver(page, "native.bootstrap", { host: "ios", debug: true, sessionId: "native-session-2" });
  await deliver(page, "native.layout", { sessionId: "native-session-2", document: second.document, recovered: false, checkpoint: second.checkpoint });
  await expect(page.getByRole("region", { name: "Scenery workshop", exact: true })).toBeHidden();
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.mode)).toBe("operate");
  await page.getByRole("button", { name: "Night", exact: true }).click();
  await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-2" });
  await expect.poll(async () => (await checkpoints(page)).length).toBe(4);
  const third = (await checkpoints(page))[3]!;
  await deliver(page, "native.saveFailed", { sessionId: "native-session-2", requestId: third.requestId,
    code: "revision_conflict", message: "The stored revision changed." });
  await expect(page.locator("#save")).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Saving is paused to protect your saved railway");
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.saveState)).toBe("blocked");
  await deliver(page, "native.requestCheckpoint", { sessionId: "native-session-2" });
  expect((await checkpoints(page)).length).toBe(4);
});

test("pinch gesture does not commit scenery and focused buttons keep keyboard activation", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openRailway(page);
  const arrange = page.getByRole("button", { name: "Arrange scenery", exact: true });
  await arrange.focus(); await page.keyboard.press("Space");
  await expect(page.getByRole("region", { name: "Scenery workshop", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Place fir tree", exact: true }).click();
  const before = await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 630, y: 410, id: 1 }, { x: 680, y: 410, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 620, y: 410, id: 1 }, { x: 690, y: 410, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.getByRole("button", { name: "Close scenery workshop", exact: true }).click();
  expect(await page.evaluate(() => window.__TIN_DIAGNOSTICS__!.sceneryCount)).toBe(before);
});

test("portrait controls and name editing stay usable as the viewport shrinks", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await openRailway(page);
  for (const name of ["Stop train", "Run train", "Arrange scenery", "Overview camera", "Trackside camera", "Overhead camera"]) {
    const button = page.getByRole("button", { name, exact: true });
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(430);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
  }
  await page.screenshot({ path: "test-results/first-railway-portrait.png" });
  await page.getByRole("button", { name: "Night", exact: true }).click();
  await expect(page.getByRole("button", { name: "Night", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: "test-results/first-railway-night-portrait.png" });

  await page.setViewportSize({ width: 358, height: 540 });
  await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
  const nameField = page.getByRole("textbox", { name: "Layout name", exact: true });
  const close = page.getByRole("button", { name: "Close scenery workshop", exact: true });
  await nameField.click();
  // Model the smaller web-view geometry while the native software keyboard is open.
  // The real keyboard/edit/relaunch path is also exercised by the native UI suite.
  await page.setViewportSize({ width: 358, height: 300 });
  for (const control of [nameField, close]) {
    await expect(control).toBeVisible();
    expect(await control.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
    })).toBe(true);
  }
  await nameField.fill("Pocket railway");
  await close.click();
  await expect(page.getByRole("region", { name: "Scenery workshop", exact: true })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Pocket railway", exact: true })).toBeVisible();
});
