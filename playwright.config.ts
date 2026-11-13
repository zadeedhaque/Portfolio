import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // Every page runs a WebGL background, which is software-rendered in headless
  // Chromium, so keep the worker count low to avoid starving the browsers.
  workers: 2,
  timeout: 45000,
  retries: 1,
  reporter: "line",
  use: { baseURL: "http://localhost:4321", ...devices["Desktop Chrome"] },
  webServer: { command: "npm run preview", url: "http://localhost:4321", reuseExistingServer: true, timeout: 60000 },
});
