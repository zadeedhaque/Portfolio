import { expect, test, type Page } from "@playwright/test";

const yaw = async (page: Page) => Number(await page.locator("#scene").getAttribute("data-yaw"));
const box = async (page: Page, selector: string) => (await page.locator(selector).boundingBox())!;

test("tapping the glass logo cycles six looks", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("button", { name: /glass logo/i });
  const glows = new Set<string>();
  const tiles = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const [glow, tile] = await logo.locator(".glass").evaluate((n) => {
      const s = (n as HTMLElement).style;
      return [s.getPropertyValue("--glow"), `${s.getPropertyValue("--lx")},${s.getPropertyValue("--ly")}`];
    });
    glows.add(glow!);
    tiles.add(tile!);
    await logo.press("Enter");
  }
  expect(glows.size).toBeGreaterThanOrEqual(4); // two looks share #f73650
  expect(tiles.size).toBe(6);
});

test("idle spin is about 42 degrees per second at any frame rate", async ({ page }) => {
  await page.goto("/");
  await page.locator("#studio").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const t0 = Date.now(), a = await yaw(page);
  await page.waitForTimeout(2000);
  const b = await yaw(page), seconds = (Date.now() - t0) / 1000;
  expect((b - a) / seconds).toBeGreaterThan(34);
  expect((b - a) / seconds).toBeLessThan(50);
});

test("logo is centred on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const s = await box(page, "#scene"), c = await box(page, ".studio");
  expect(Math.abs(s.x + s.width / 2 - (c.x + c.width / 2))).toBeLessThan(2);
});

test("a click leaves a ripple, and the mouse gets the custom cursor", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(300, 300);
  await expect(page.locator("html")).toHaveClass(/has-cursor/);
  await page.mouse.move(400, 400);
  await page.mouse.down();
  await expect(page.locator(".ripple")).toHaveCount(1);
  await page.mouse.up();
  await page.locator("#stage").hover();
  await expect(page.locator("#cur-ring")).toHaveText("Play");
});

test("reduced motion: no custom cursor, no ripple", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/has-cursor/);
  await page.mouse.click(200, 200);
  await expect(page.locator(".ripple")).toHaveCount(0);
  await context.close();
});
