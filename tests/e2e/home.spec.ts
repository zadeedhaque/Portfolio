import { expect, test } from "@playwright/test";

test("Developer shows 11 cards, Creator shows 7", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-show="dev"] .card:visible')).toHaveCount(11);
  await page.getByRole("button", { name: "Creator", exact: true }).click();
  await expect(page.locator('[data-show="creator"] .card:visible')).toHaveCount(7);
  await expect(page.locator('[data-show="dev"] .card:visible')).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creator");
});

test("the hero button flips the mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Creator side" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creator");
  await expect(page.locator("body")).toHaveAttribute("data-pal", "white");
  await page.getByRole("button", { name: "Developer side" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dev");
});

test("palette follows the section in view, and the footer at page end", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-pal", "blue");
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator("body")).toHaveAttribute("data-pal", "plum");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator("body")).toHaveAttribute("data-pal", "forest");
});

test("theme button locks one palette", async ({ page }) => {
  await page.goto("/");
  await page.locator("#theme").click(); // light
  await page.locator("#off").scrollIntoViewIfNeeded();
  await expect(page.locator("body")).toHaveAttribute("data-pal", "paper");
  await page.locator("#theme").click(); // dark
  await expect(page.locator("body")).toHaveAttribute("data-pal", "forest");
  await page.reload();
  await expect(page.locator("#theme")).toHaveAttribute("aria-label", "Colour theme: dark. Press to change.");
});

test("contact has five links in order", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#contact .cta a")).toHaveText([/LinkedIn/, /GitHub/, /YouTube/, /Instagram/, /Facebook/]);
});

test("with JavaScript off, Developer content is visible", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator('[data-show="dev"] .card').first()).toBeVisible();
  expect(await page.locator(".rv").first().evaluate((n) => getComputedStyle(n).opacity)).toBe("1");
  await expect(page.locator('[data-show="creator"] .card').first()).toBeHidden();
  await context.close();
});

test("Developer cards show their video posters", async ({ page }) => {
  await page.goto("/");
  const posters = page.locator('[data-show="dev"] .card .slot.media img');
  await expect(posters).toHaveCount(9);
  for (const img of await posters.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(1280);
  }
});

test("hovering a card plays its demo video, leaving pauses it", async ({ page }) => {
  await page.goto("/");
  const card = page.locator('[data-show="dev"] .card').first();
  const video = card.locator("video");
  await expect(video).not.toHaveAttribute("src", /.+/);   // nothing downloaded before it is wanted
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.3);
  await expect(card.locator(".slot.media")).toHaveClass(/playing/);
  await page.mouse.move(2, 2);
  await expect(card.locator(".slot.media")).not.toHaveClass(/playing/);
});

test("on a phone the card in view plays", async ({ browser }) => {
  const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })).newPage();
  await page.goto("/");
  const slot = page.locator('[data-show="dev"] .card .slot.media').nth(1);
  await slot.scrollIntoViewIfNeeded();
  await expect.poll(() => slot.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0.3);
});

test("reduced motion: card videos never autoplay", async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
  await page.goto("/");
  const card = page.locator('[data-show="dev"] .card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await page.waitForTimeout(800);
  await expect(card.locator("video")).not.toHaveAttribute("src", /.+/);
});

for (const part of [".slot", "h3", "p", ".chips"])
  test(`one click on a card's ${part} opens the project page`, async ({ page }) => {
    await page.goto("/");
    const card = page.locator('[data-show="dev"] .card').first();
    await card.scrollIntoViewIfNeeded();
    await card.locator(part).first().click();
    await expect(page).toHaveURL(/\/work\/lava-lift\/?$/);
  });

for (const part of [".slot", "p"])
  test(`one tap on a card's ${part} opens the project page on a phone`, async ({ browser }) => {
    const page = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })).newPage();
    await page.goto("/");
    const card = page.locator('[data-show="dev"] .card').nth(1);
    await card.scrollIntoViewIfNeeded();
    await card.locator(part).first().tap();
    await expect(page).toHaveURL(/\/work\/learn-salah\/?$/);
  });

test("a card's Open link still goes to the live site, not the project page", async ({ page, context }) => {
  await page.goto("/");
  const card = page.locator('[data-show="dev"] .card').first();
  await card.scrollIntoViewIfNeeded();
  const [popup] = await Promise.all([context.waitForEvent("page"), card.getByRole("link", { name: /Open Lava Lift/ }).click()]);
  expect(popup.url()).toContain("lava-lift");
  expect(new URL(page.url()).pathname).toBe("/");
});

test("Ctrl+click on a card opens the project in a new tab", async ({ page, context }) => {
  await page.goto("/");
  const card = page.locator('[data-show="dev"] .card').first();
  await card.scrollIntoViewIfNeeded();
  const [tab] = await Promise.all([context.waitForEvent("page"), card.locator("p").click({ modifiers: ["Control"] })]);
  await expect(tab).toHaveURL(/\/work\/lava-lift\/?$/);
  expect(new URL(page.url()).pathname).toBe("/");
});
