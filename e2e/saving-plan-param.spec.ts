import { expect, test, type Page, type Route } from "@playwright/test";

const PAID_STATUS = {
  paymentDetail: {
    _id: "pay1",
    completedAt: "2026-01-01T00:00:00Z",
    expiredAt: "2030-01-01T00:00:00Z",
  },
};

const detail = {
  _id: "p1",
  name: "儲蓄計劃A",
  info: "計劃詳情說明",
  bg: "#123456",
  price: 0,
  ...PAID_STATUS,
  sheetDetail: { _id: "sh1", isSynced: true, driveItemId: "drive1" },
  insuranceCompanyDetail: {
    _id: "co1",
    name: "友記",
    realName: "Friend Co",
    bg: "#8e1f3d",
  },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const param = {
  _id: "pm1",
  planId: "p1",
  periodOptions: ["5", "10"],
  currencyOptions: ["USD", "HKD"],
  premiumHeaders: [],
  deathHeaders: [],
  infoCell: "",
  infoRange: "",
  withdrawalCol: "",
  withdrawalLength: 0,
  createdAt: "",
  updatedAt: "",
};

const personalInfo = {
  name: "Tester",
  sex: "男",
  age: 30,
  period: 5,
  currency: "USD",
  amount: 100000,
  instal: "5000",
};

/** Fulfill a route with the API's `{ data }` envelope. */
const sendData = (data: unknown) => (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });

async function authenticate(page: Page) {
  await page
    .context()
    .addCookies([
      { name: "wv_token", value: "test-jwt", domain: "localhost", path: "/" },
    ]);
}

/** Mock the four GETs the screen loads on mount. */
async function mockReads(page: Page) {
  await page.route(/\/api\/plan\/p1\/status(\?|$)/, sendData(detail));
  await page.route(/\/api\/plan\/p1\/param(\?|$)/, sendData(param));
  await page.route(/\/api\/plan\/p1(\?|$)/, sendData(detail));
  await page.route(
    /\/api\/sheet\/s1\/personalInfo(\?|$)/,
    (route) => sendData(personalInfo)(route), // GET (PUT is overridden per-test)
  );
  // Default booster (no uplift, so it isn't offered). Must be mocked or the unmocked 401
  // trips the api interceptor, clears the token, and bounces the next nav to /unauthorized.
  await page.route(
    /\/api\/plan\/p1\/booster(\?|$)/,
    sendData({ beforeBooster: 5000, afterBooster: 5000 }),
  );
}

const URL = "/zh-HK/plans/saving/param?planId=p1&sheetId=s1";

async function fillAndSubmit(page: Page) {
  await page.getByPlaceholder("輸入姓名").fill("Tester");
  await page.getByPlaceholder("輸入年齡").fill("30");
  await page.getByRole("button", { name: "下一步" }).click();
}

test.describe("/plans/saving/param (saving)", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await mockReads(page);
  });

  test("renders the param form for a paid plan", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByText("輸入保單參數")).toBeVisible();
    await expect(page.getByPlaceholder("輸入姓名")).toBeVisible();
    await expect(page.getByRole("button", { name: "下一步" })).toBeVisible();
  });

  test("shows the expired card when the plan is unpaid/expired", async ({
    page,
  }) => {
    // Status without paymentDetail → never syncs → expired.
    const { paymentDetail, ...expired } = detail;
    void paymentDetail;
    await page.route(/\/api\/plan\/p1\/status(\?|$)/, sendData(expired));
    await page.goto(URL);

    await expect(page.getByText("會員已過期...")).toBeVisible();
    await expect(page.getByText("輸入保單參數")).toHaveCount(0);
  });

  test("submitting the form opens the premium sheet", async ({ page }) => {
    await page.route(/\/api\/sheet\/s1\/personalInfo(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          )
        : sendData(personalInfo)(route),
    );
    await page.goto(URL);
    await fillAndSubmit(page);

    await expect(page.getByText("輸入投保金額")).toBeVisible();
    await expect(page.getByText("USD$ 100000")).toBeVisible();
  });

  test("the expected-installment change PUTs /cal with a bare-number body", async ({
    page,
  }) => {
    let calBody: string | null = null;
    let calContentType: string | undefined;
    await page.route(/\/api\/sheet\/s1\/personalInfo(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          )
        : sendData(personalInfo)(route),
    );
    await page.route(/\/api\/sheet\/s1\/cal(\?|$)/, (route) => {
      if (route.request().method() === "PUT") {
        calBody = route.request().postData();
        calContentType = route.request().headers()["content-type"];
      }
      return sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
        route,
      );
    });
    await page.goto(URL);
    await fillAndSubmit(page);

    await page.getByPlaceholder("輸入期望保費").fill("5000");
    // The body is the raw number, sent as application/json (else the Json<i32> API 415s).
    await expect.poll(() => calBody).toBe("5000");
    expect(calContentType).toContain("application/json");
  });

  test("a premium mismatch reveals adjust, which PUTs /calAdjust", async ({
    page,
  }) => {
    let adjustCalled = false;
    await page.route(/\/api\/sheet\/s1\/personalInfo(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          )
        : sendData(personalInfo)(route),
    );
    // cal returns a figure that doesn't match the expected installment.
    await page.route(
      /\/api\/sheet\/s1\/cal(\?|$)/,
      sendData({ instal: "4999", instal_num: 4999, amount: "100000" }),
    );
    await page.route(/\/api\/sheet\/s1\/calAdjust(\?|$)/, (route) => {
      adjustCalled = true;
      return sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
        route,
      );
    });
    await page.goto(URL);
    await fillAndSubmit(page);

    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect(page.getByText("真實保費與期望保費有偏差")).toBeVisible();
    await page.getByRole("button", { name: "調整" }).click();
    await expect.poll(() => adjustCalled).toBe(true);
  });

  test("offers and applies the booster when available", async ({ page }) => {
    await page.route(/\/api\/sheet\/s1\/personalInfo(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          )
        : sendData(personalInfo)(route),
    );
    await page.route(
      /\/api\/sheet\/s1\/cal(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.route(
      /\/api\/plan\/p1\/booster(\?|$)/,
      sendData({ beforeBooster: 5000, afterBooster: 6000 }),
    );
    await page.goto(URL);
    await fillAndSubmit(page);

    await page.getByPlaceholder("輸入期望保費").fill("5000");
    const booster = page.getByRole("button", { name: "點擊享推廣優惠" });
    await expect(booster).toBeVisible();
    await booster.click();
    await expect(page.getByText(/活動優惠推廣/)).toBeVisible();
  });

  test("the info button opens a dialog with the plan info", async ({
    page,
  }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: "提示" }).click();
    await expect(
      page.getByRole("dialog").getByText("計劃詳情說明"),
    ).toBeVisible();
  });

  test("generate-sheet navigates to the sheet route", async ({ page }) => {
    await page.route(/\/api\/sheet\/s1\/personalInfo(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          )
        : sendData(personalInfo)(route),
    );
    await page.route(
      /\/api\/sheet\/s1\/cal(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.goto(URL);
    await fillAndSubmit(page);

    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect(page.getByText("USD$ 5000")).toBeVisible();
    await page.getByRole("button", { name: "生成報表" }).click();
    // The /plans/saving/sheet page is a placeholder (not built yet) so it 404s, but the URL —
    // i.e. that generate navigates to the right route with the right params — is asserted.
    await expect(page).toHaveURL(
      /\/plans\/saving\/sheet\?planId=p1&sheetId=s1/,
    );
  });

  test("polls plan status every 3s until the sheet is synced", async ({
    page,
  }) => {
    let statusHits = 0;
    // Paid but not yet synced → the poller keeps refetching.
    const notSynced = {
      ...detail,
      sheetDetail: { _id: "sh1", isSynced: false },
    };
    await page.route(/\/api\/plan\/p1\/status(\?|$)/, (route) => {
      statusHits += 1;
      return sendData(notSynced)(route);
    });
    await page.goto(URL);
    await expect(page.getByText("輸入保單參數")).toBeVisible();

    await expect.poll(() => statusHits, { timeout: 6000 }).toBeGreaterThan(1);
  });
});
