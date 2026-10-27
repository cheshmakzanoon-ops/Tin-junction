import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

test.setTimeout(60_000);

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
    const rect = node.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return hit === node || (hit !== null && node.contains(hit));
  })).toBe(true);
}

for (const viewport of [
  { width: 1100, height: 760 },
  { width: 390, height: 844 },
  { width: 358, height: 300 },
  { width: 844, height: 390 },
]) {
  test(`essential controls stay readable and hittable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/?capture=1");
    await page.waitForFunction(() => window.__TIN_DIAGNOSTICS__?.initialized && window.__TIN_DIAGNOSTICS__?.loaded);
    for (const name of ["Save layout", "How to play", "Daylight", "Evening", "Night", "Overview camera", "Trackside camera", "Overhead camera", "Run train", "Sound whistle", "Stop train", "Arrange scenery"]) {
      await usableTarget(page.getByRole("button", { name, exact: true }), page);
    }
    await usableTarget(page.getByRole("slider", { name: "Throttle" }), page);
    expect(await page.locator(".train-buttons button").first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(11);
    expect(await page.locator("#run-symbol").evaluate(node => getComputedStyle(node).fontSize)).toBe("0px");
    expect(await page.locator("#run-symbol").evaluate(node => getComputedStyle(node, "::before").borderLeftWidth)).toBe("11px");
    await page.screenshot({ path: `test-results/controls-${viewport.width}x${viewport.height}.png` });

    await page.getByRole("button", { name: "Arrange scenery", exact: true }).click();
    await usableTarget(page.getByRole("button", { name: "Close scenery workshop", exact: true }), page);
    if (viewport.height > 500) {
      for (const name of ["Daylight", "Evening", "Night", "Overview camera", "Trackside camera", "Overhead camera"]) {
        await usableTarget(page.getByRole("button", { name, exact: true }), page);
      }
    }
    const name = page.getByRole("textbox", { name: "Layout name", exact: true });
    await name.fill("Accessible afternoon");
    await name.press("Tab");
    // During editing, verify the committed model-backed title, then confirm
    // it returns visibly when the workshop is dismissed at this same size.
    await expect(page.locator("#layout-title")).toHaveText("Accessible afternoon");
    await page.screenshot({ path: `test-results/editor-${viewport.width}x${viewport.height}.png` });
    await page.getByRole("button", { name: "Close scenery workshop", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Accessible afternoon", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "How to play", exact: true }).click();
    await usableTarget(page.getByRole("button", { name: "Close help", exact: true }), page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: "How to play", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close help", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
}
