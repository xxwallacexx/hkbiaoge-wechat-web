import { expect, test, type Page, type Route } from "@playwright/test";

const PAID = {
  _id: "pay1",
  completedAt: "2026-01-01T00:00:00Z",
  expiredAt: "2030-01-01T00:00:00Z",
};

const status = (
  sheetDetail: Record<string, unknown> | null,
  paymentDetail: Record<string, unknown> | null = PAID,
) => ({
  _id: "1",
  name: "儲蓄計劃A",
  info: "計劃詳情說明",
  bg: "#123456",
  price: 0,
  paymentDetail,
  sheetDetail,
  insuranceCompanyDetail: {
    _id: "co1",
    name: "友記",
    realName: "Friend Co",
    bg: "#8e1f3d",
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

/** Fulfill a route with the API's `{ data }` envelope. */
const sendData = (data: unknown) => (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });

/** Drop a wv_token cookie so the proxy + client treat the page as signed in. */
async function authenticate(page: Page) {
  await page
    .context()
    .addCookies([
      { name: "wv_token", value: "test-jwt", domain: "localhost", path: "/" },
    ]);
}

const SAVING_PARAM = encodeURIComponent("/plans/saving/param");
const SYNC_URL = `/zh-HK/plans/sheetSync?planId=1&destination=${SAVING_PARAM}`;

test.describe("/plans/sheetSync", () => {
  test("waits on the worksheet while the plan is paid but unsynced", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(
      /\/api\/plan\/1\/status$/,
      sendData(status({ _id: "sh1", isSynced: false })),
    );

    await page.goto(SYNC_URL);

    await expect(
      page.getByText("產品已開通，請耐心等待資源下載。"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/plans\/sheetSync/);
  });

  test("hands off to the destination screen once the worksheet lands", async ({
    page,
  }) => {
    await authenticate(page);
    let polls = 0;
    await page.route(/\/api\/plan\/1\/status$/, (route) => {
      polls += 1;
      // The webhook writes isSynced + driveItemId together, one poll later.
      const sheetDetail =
        polls === 1
          ? { _id: "sh1", isSynced: false }
          : { _id: "sh1", isSynced: true, driveItemId: "drive-1" };
      return sendData(status(sheetDetail))(route);
    });
    // Endpoints the param screen loads after the hand-off.
    await page.route(/\/api\/plan\/1$/, sendData(status(null)));
    await page.route(
      /\/api\/plan\/1\/param$/,
      sendData({
        _id: "pm1",
        planId: "1",
        periodOptions: ["5"],
        currencyOptions: ["USD"],
        premiumHeaders: [],
        deathHeaders: [],
        infoCell: "",
        infoRange: "",
        withdrawalCol: "",
        withdrawalLength: 0,
        createdAt: "",
        updatedAt: "",
      }),
    );
    await page.route(
      /\/api\/sheet\/drive-1\/personalInfo$/,
      sendData({ name: "", sex: "", age: 0, period: 0, currency: "" }),
    );

    await page.goto(SYNC_URL);

    await expect(page).toHaveURL(
      /\/plans\/saving\/param\?planId=1&sheetId=drive-1/,
      { timeout: 15_000 },
    );
  });

  test("stops on the expired card when the membership is gone", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(
      /\/api\/plan\/1\/status$/,
      sendData(status({ _id: "sh1", isSynced: false }, null)),
    );

    await page.goto(SYNC_URL);

    await expect(page.getByText("會員已過期...")).toBeVisible();
  });

  test("refuses a destination that isn't a ported plan route", async ({
    page,
  }) => {
    await authenticate(page);

    await page.goto(
      `/zh-HK/plans/sheetSync?planId=1&destination=${encodeURIComponent("https://evil.example/phish")}`,
    );

    await expect(
      page.getByText("無法開啟此產品，請返回產品列表重試。"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/plans\/sheetSync/);
    await page.getByRole("link", { name: "返回產品列表" }).click();
    await expect(page).toHaveURL(/\/zh-HK\/plans$/);
  });

  test("refuses a missing planId", async ({ page }) => {
    await authenticate(page);

    await page.goto(`/zh-HK/plans/sheetSync?destination=${SAVING_PARAM}`);

    await expect(
      page.getByText("無法開啟此產品，請返回產品列表重試。"),
    ).toBeVisible();
  });
});
