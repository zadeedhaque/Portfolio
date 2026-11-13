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

test("unknown pages get the 404 page", async ({ page }) => {
  await page.goto("/404");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Nothing here/);
  await page.getByRole("link", { name: /Back home/ }).click();
  await expect(page).toHaveURL(/\/$/);
});
