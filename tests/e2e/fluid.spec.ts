import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

test("the fluid canvas draws without WebGL errors", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator("#water")).toHaveCount(1);
  await page.mouse.move(200, 300);
  await page.mouse.move(420, 360, { steps: 8 });
  await page.mouse.click(500, 400);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (document.getElementById("water") as HTMLCanvasElement).getContext("webgl2")!.getError())).toBe(0);
  // Switching mode swaps gas for water on the same canvas.
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await page.mouse.click(300, 300);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (document.getElementById("water") as HTMLCanvasElement).getContext("webgl2")!.getError())).toBe(0);
  expect(errors).toEqual([]);
});

test("reduced motion: no fluid canvas", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#water")).toHaveCount(0);
  await context.close();
});

test("without WebGL2 the plain background shows and the site still works", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type === "webgl2" ? null : (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator("#water")).toHaveCount(0);
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creator");
  await expect(page.locator("#count")).toHaveText(/\/ 190$/); // the 2D game canvas is unaffected
  expect(errors).toEqual([]);
});
