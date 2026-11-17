import { expect, test } from "@playwright/test";

const withVideo = ["lava-lift", "learn-salah", "dhakar-rasta", "physics-lab", "crownfall", "neon-snake", "handwritten-numbers", "spin-and-win"];
const withoutVideo = ["medicare-bd", "60-projects"];

for (const slug of [...withVideo, ...withoutVideo])
  test(`/work/${slug} has its video area above the case study`, async ({ page, request }) => {
    expect((await page.goto(`/work/${slug}`))!.status()).toBe(200);
    await expect(page).toHaveTitle(/ · Zadeed Haque$/);
    const hasVideo = withVideo.includes(slug);
    const area = hasVideo ? page.locator("video") : page.getByLabel(/Video demo of .* coming soon/);
    await expect(area).toBeVisible();
    await expect(page.locator("video")).toHaveCount(hasVideo ? 1 : 0);
    if (hasVideo) {
      await expect(page.locator("video")).toHaveAttribute("poster", `/media/${slug}.jpg`);
      for (const file of [`/media/${slug}.mp4`, `/media/${slug}.jpg`]) expect((await request.get(file)).status(), file).toBe(200);
    }
    await expect(page.locator("article img, article svg")).toHaveCount(0);
    expect((await area.boundingBox())!.y).toBeLessThan((await page.locator("article h2").first().boundingBox())!.y);
    await expect(page.getByRole("link", { name: /Next/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Previous/ })).toBeVisible();
  });

test("a demo video plays", async ({ page }) => {
  await page.goto("/work/lava-lift");
  const ok = await page.locator("video").evaluate(async (v: HTMLVideoElement) => { await v.play(); await new Promise((r) => setTimeout(r, 800)); return { time: v.currentTime, w: v.videoWidth, h: v.videoHeight }; });
  expect(ok.time).toBeGreaterThan(0.3);
  expect([ok.w, ok.h]).toEqual([1280, 720]);
});

test("previous / next wrap around the project list", async ({ page }) => {
  await page.goto("/work/60-projects");
  await page.getByRole("link", { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/work\/lava-lift\/?$/);
  await page.getByRole("link", { name: /Previous/ }).click();
  await expect(page).toHaveURL(/\/work\/60-projects\/?$/);
});

test("home cards link to project pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Lava Lift", exact: true }).click();
  await expect(page).toHaveURL(/\/work\/lava-lift\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lava Lift");
});

test("academics", async ({ page }) => {
  await page.goto("/academics");
  await expect(page.getByText("CGPA 3.64 / 4.00")).toBeVisible();
  await expect(page.getByText("GPA 5.00 / 5.00", { exact: false }).first()).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(4);
  await page.getByRole("link", { name: /Cloud Computing/ }).click();
  await expect(page).toHaveURL(/\/academics\/cloud-computing\/?$/);
  await expect(page.getByText("$712")).toBeVisible();
  await page.getByRole("link", { name: /Back to Academics/ }).click();
  await expect(page).toHaveURL(/\/academics\/?$/);
});

test("header nav reaches Academics from every page", async ({ page }) => {
  await page.goto("/work/crownfall");
  await page.getByRole("link", { name: "Academics" }).click();
  await expect(page).toHaveURL(/\/academics\/?$/);
});

test("header nav reaches home sections from other pages", async ({ page }) => {
  await page.goto("/academics");
  await page.getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await expect(page.locator("#work")).toBeInViewport();
});
