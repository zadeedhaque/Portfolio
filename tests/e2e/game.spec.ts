import { expect, test } from "@playwright/test";

const paddleX = async (page: import("@playwright/test").Page) => Number(await page.locator("#stage").getAttribute("data-paddle-x"));

test("the stage is focusable, labelled and keyboard-playable", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("#stage");
  await expect(stage).toHaveAttribute("aria-label", /arrow keys/);
  await stage.focus();
  await expect(stage).toBeFocused();
  await expect(stage).toHaveAttribute("data-paddle-x", /\d+/);
  await page.keyboard.down("ArrowLeft");
  await expect.poll(() => paddleX(page), { timeout: 8000 }).toBeLessThan(200);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowRight");
  await expect.poll(() => paddleX(page), { timeout: 8000 }).toBeGreaterThan(900);
  await page.keyboard.up("ArrowRight");
  await expect(page.locator("#hint")).toHaveText("");
});

test("the #bonus demo shortcut is gone", async ({ page }) => {
  await page.goto("/#bonus");
  await page.waitForTimeout(800);
  await expect(page.locator("#pop")).toBeHidden();
  await expect(page.locator("#count")).toHaveText(/^\d+ \/ 190$/);
});

test("the game plays itself until someone steers", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#hint")).toHaveText("Move to play");
  await expect.poll(async () => Number((await page.locator("#count b").textContent()) ?? 0), { timeout: 15000 }).toBeGreaterThan(0);
});

test("reduced motion: the game waits for a tap", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#hint")).toHaveText("Tap to start");
  await page.waitForTimeout(2000);
  await expect(page.locator("#count")).toHaveText("0 / 190");
  await page.locator("#stage").click();
  await expect(page.locator("#hint")).toHaveText("");
  await context.close();
});

test("the game survives a resize mid-play", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  const x = await paddleX(page);
  expect(Number.isFinite(x)).toBe(true);
  expect(x).toBeLessThanOrEqual(375);
  await expect(page.locator("#count")).toHaveText(/\/ 190$/);
});
