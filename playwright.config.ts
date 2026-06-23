import { defineConfig } from "@playwright/test";

// Smoke tests for the embed + plans flows. Run with: npm run build && npm run test:e2e
// First time only: npx playwright install chromium
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "PORT=3100 npm run start",
    url: "http://localhost:3100/zh-CN",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
