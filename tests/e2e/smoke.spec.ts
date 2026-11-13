import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

test("home loads cleanly with self-hosted fonts", async ({ page }) => {
  const errors = watchErrors(page);
  const res = await page.goto("/");
  expect(res!.status()).toBe(200);
  await expect(page).toHaveTitle("Zadeed Haque");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('700 20px "Space Grotesk Variable"'))).toBe(true);
  const mono = await page.evaluate(() => [...document.querySelectorAll("*")].filter((n) => /mono/i.test(getComputedStyle(n).fontFamily)).length);
  expect(mono).toBe(0);
  expect(errors).toEqual([]);
});

test("no horizontal scroll on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/work/crownfall", "/academics", "/academics/cloud-computing"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(375);
  }
});

for (const width of [320, 375, 430])
  test(`mode switch is centred in the header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/");
    const sw = (await page.locator(".switch").boundingBox())!;
    const theme = (await page.locator("#theme").boundingBox())!;
    expect(Math.abs(sw.x + sw.width / 2 - width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(theme.y + theme.height / 2 - (sw.y + sw.height / 2))).toBeLessThanOrEqual(2); // same row
  });

test("unknown pages get the 404 page", async ({ page }) => {
  await page.goto("/404");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Nothing here/);
  await expect(page.locator(".pixels .px.on")).toHaveCount(47); // "404" in pixel bricks
  await page.getByRole("link", { name: /Back home/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the favicon is served, so pages log no 404", async ({ page, request }) => {
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  const failed: string[] = [];
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.url()); });
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.ico");
  expect(failed).toEqual([]);
});

test("the loading cover fades out and never blocks input", async ({ page }) => {
  await page.goto("/");
  const cover = page.locator(".loader");
  await expect(cover).toHaveCSS("pointer-events", "none");
  await expect(cover).toBeHidden({ timeout: 5000 });
  await expect(page.locator("main")).toHaveCSS("opacity", "1");
});

test("reduced motion: no loading cover", async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  await page.goto("/");
  await expect(page.locator(".loader")).toBeHidden();
});
