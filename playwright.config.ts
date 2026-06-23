import { defineConfig, devices } from "@playwright/test";

// Run functional smoke tests with: npm run build && npm run test:e2e
// First time only: npx playwright install chromium
// Visual regression is a separate project — see e2e/README.md (runs in Docker).
export default defineConfig({
  testDir: "./e2e",
  // A little tolerance absorbs sub-pixel anti-aliasing noise between runs.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "PORT=3100 npm run start",
    url: "http://localhost:3100/zh-CN",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      // Browser-agnostic assertions. Fast; safe to run anywhere.
      name: "functional",
      testIgnore: /\.visual\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Visual regression. Baselines are OS-specific, so generate AND run them in
      // the Playwright Docker image (Linux) — see e2e/README.md — otherwise macOS
      // vs CI font rendering produces false diffs.
      name: "visual",
      testMatch: /\.visual\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
