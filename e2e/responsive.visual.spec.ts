import { expect, test } from "@playwright/test";

// Visual-regression baselines for the embed page on our two primary devices.
// Playwright has no exact "iPhone XR" / "iPad Air" descriptors, so we set the CSS
// viewports explicitly (both are iOS @2x). Generate/run these in Docker so the
// baselines match CI — see e2e/README.md.
const DEVICES = [
  { name: "iphone-xr", viewport: { width: 414, height: 896 } },
  { name: "ipad-air", viewport: { width: 820, height: 1180 } },
];

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      viewport: device.viewport,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    test("embed page layout", async ({ page }) => {
      // Block the external WeChat JS-SDK so rendering is deterministic and offline-
      // safe; with no wx bridge the page settles into the "regular browser" state.
      await page.route(/jweixin.*\.js$/, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: "",
        }),
      );

      await page.goto("/zh-CN");
      // The env/auth checks are async — wait for them to settle before snapshotting.
      await expect(page.getByText("普通浏览器")).toBeVisible();

      await expect(page).toHaveScreenshot(`${device.name}.png`);
    });
  });
}
