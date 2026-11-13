import { expect, test } from "@playwright/test";
import { watchErrors } from "./helpers";

test("the site works when storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dev");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "auto");
  // Switches still work for this page view.
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creator");
  await page.locator("#theme").click();
  await expect(page.locator("#theme")).toHaveAttribute("aria-label", /light/);
  expect(errors).toEqual([]);
});
