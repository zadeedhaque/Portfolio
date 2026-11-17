import { existsSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { filesUnder } from "./helpers";

// Reduced motion gives a still page with no fluid canvas, so contrast can be measured.
test.use({ reducedMotion: "reduce" });

for (const pal of ["blue", "forest", "plum", "olive", "paper", "white", "red", "black", "sage", "teal"])
  test(`no contrast violations on the ${pal} palette`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((p) => {
      document.body.dataset.pal = p;
    }, pal);
    const res = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(res.violations).toEqual([]);
  });

test("no contrast violations in Creator mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  for (const pal of ["white", "red", "black", "sage", "teal"]) {
    await page.evaluate((p) => {
      document.body.dataset.pal = p;
    }, pal);
    const res = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(res.violations, pal).toEqual([]);
  }
});

for (const path of ["/", "/work/lava-lift", "/work/crownfall", "/academics", "/academics/cloud-computing", "/404"])
  test(`axe passes on ${path}`, async ({ page }) => {
    await page.goto(path);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

test("no leftover files or images from the old site", () => {
  for (const gone of ["index.html", "work.html", "academics.html", "hobbies.html", "contact.html", "cloud-computing.html", "css", "js", "assets", "source-art", "videos"]) expect(existsSync(gone), gone).toBe(false);
  // Only the demo video posters in media/ are allowed; no old-site photos.
  expect(filesUnder("dist").filter((f) => /\.(jpe?g|png)$/i.test(f) && !/[\\/]media[\\/][\w-]+\.jpg$/.test(f))).toEqual([]);
});

test("interactive targets are at least 44 px on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/work/lava-lift"]) {
    await page.goto(path);
    const targets = await page.locator("header button:visible, header a:visible, .btn:visible, .links a:visible, .card h3 a:visible").all();
    expect(targets.length).toBeGreaterThan(5);
    for (const b of targets) expect((await b.boundingBox())!.height, await b.textContent() ?? "").toBeGreaterThanOrEqual(44);
  }
});

test("the game stage and the glass logo can be reached by keyboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("#stage").focus();
  await expect(page.locator("#stage")).toBeFocused();
  await page.locator("#scene").focus();
  await expect(page.locator("#scene")).toBeFocused();
});
