import { expect, test, type Page, type Route } from "@playwright/test";

type AnnuityType = "GENERAL" | "DEFERED" | "IMMEDIATE";

const PAID = {
  paymentDetail: {
    _id: "pay1",
    completedAt: "2026-01-01T00:00:00Z",
    expiredAt: "2030-01-01T00:00:00Z",
  },
};

const detail = {
  _id: "p1",
  name: "年金計劃A",
  info: "計劃詳情說明",
  bg: "#123456",
  price: 0,
  ...PAID,
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

const param = (annuityPlanType: AnnuityType) => ({
  _id: "pm1",
  annuityPlanType,
  periodConstraint: { oneOf: [], min: 1, max: 30 },
  periodOptions: [
    { value: "5", maxAge: 80 },
    { value: "10", maxAge: 70 },
  ],
  currencyOptions: ["USD", "HKD"],
  minAge: 1,
  maxAge: 80,
  createdAt: "",
  updatedAt: "",
});

const basicInfo = { name: "Tester", sex: "男", age: 30 };

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

/** Mock the reads + basic-info GET/PUT + the always-called displayed-type reset. */
async function mockReads(page: Page, annuityPlanType: AnnuityType = "DEFERED") {
  await page.route(/\/api\/annuityPlan\/p1\/status(\?|$)/, sendData(detail));
  await page.route(
    /\/api\/annuityPlan\/p1\/param(\?|$)/,
    sendData(param(annuityPlanType)),
  );
  await page.route(/\/api\/annuityPlan\/p1(\?|$)/, sendData(detail));
  await page.route(/\/api\/annuitySheet\/s1\/basicInfo(\?|$)/, (route) =>
    route.request().method() === "PUT"
      ? sendData("ok")(route)
      : sendData(basicInfo)(route),
  );
  await page.route(
    /\/api\/annuitySheet\/s1\/annuityDisplayedType(\?|$)/,
    sendData("ok"),
  );
}

const BASIC_URL = "/zh-HK/plans/annuity/basicInfo?planId=p1&sheetId=s1";
const PARAM_URL = "/zh-HK/plans/annuity/param?planId=p1&sheetId=s1";

test.describe("/plans/annuity (annuity)", () => {
  // ---- step 1: basic info ----

  test("basic-info renders the name/sex/age form", async ({ page }) => {
    await authenticate(page);
    await mockReads(page);
    await page.goto(BASIC_URL);
    await expect(page.getByText("輸入基本資料")).toBeVisible();
    await expect(page.getByPlaceholder("輸入姓名")).toBeVisible();
    await expect(page.getByRole("button", { name: "下一步" })).toBeVisible();
  });

  test("basic-info shows the expired card for an unpaid plan", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page);
    const { paymentDetail, ...expired } = detail;
    void paymentDetail;
    await page.route(/\/api\/annuityPlan\/p1\/status(\?|$)/, sendData(expired));
    await page.goto(BASIC_URL);
    await expect(page.getByText("會員已過期...")).toBeVisible();
    await expect(page.getByText("輸入基本資料")).toHaveCount(0);
  });

  test("submitting basic info navigates to the param step", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page);
    await page.goto(BASIC_URL);
    await page.getByPlaceholder("輸入姓名").fill("Tester");
    await page.getByPlaceholder("輸入年齡").fill("30");
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page).toHaveURL(
      /\/plans\/annuity\/param\?planId=p1&sheetId=s1/,
    );
  });

  // ---- step 2: param — GENERAL (amount is a form field, no premium sheet) ----

  test("type GENERAL: submit writes info (with amount) + resets displayed-type, then navigates to the sheet", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "GENERAL");
    let infoBody: string | null = null;
    let displayedTypeCalled = false;
    await page.route(/\/api\/annuitySheet\/s1\/info(\?|$)/, (route) => {
      if (route.request().method() === "PUT")
        infoBody = route.request().postData();
      return sendData("ok")(route);
    });
    await page.route(
      /\/api\/annuitySheet\/s1\/annuityDisplayedType(\?|$)/,
      (route) => {
        displayedTypeCalled = true;
        return sendData("ok")(route);
      },
    );
    await page.goto(PARAM_URL);

    await page.getByPlaceholder("年期").fill("10");
    await page.getByPlaceholder("請輸入金額").fill("40000");
    await page.getByRole("button", { name: "下一步" }).click();

    await expect(page).toHaveURL(
      /\/plans\/annuity\/sheet\?planId=p1&sheetId=s1/,
    );
    expect(infoBody).toContain("amount");
    expect(displayedTypeCalled).toBe(true);
  });

  // ---- step 2: param — DEFERED (premium sheet with cal + adjust) ----

  test("type DEFERED: submit opens the premium sheet; /cal is a bare-number application/json body", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "DEFERED");
    let calBody: string | null = null;
    let calContentType: string | undefined;
    await page.route(/\/api\/annuitySheet\/s1\/info(\?|$)/, sendData("ok"));
    await page.route(/\/api\/annuitySheet\/s1\/cal(\?|$)/, (route) => {
      if (route.request().method() === "PUT") {
        calBody = route.request().postData();
        calContentType = route.request().headers()["content-type"];
      }
      // GET (initial after info) and PUT (debounced) both return a matching figure here.
      return sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
        route,
      );
    });
    await page.goto(PARAM_URL);

    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByText("USD$ 100000")).toBeVisible();
    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect.poll(() => calBody).toBe("5000");
    expect(calContentType).toContain("application/json");
  });

  test("type DEFERED: a premium mismatch reveals adjust, which PUTs /calAdjust", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "DEFERED");
    let adjustCalled = false;
    await page.route(/\/api\/annuitySheet\/s1\/info(\?|$)/, sendData("ok"));
    await page.route(/\/api\/annuitySheet\/s1\/cal(\?|$)/, (route) =>
      route.request().method() === "PUT"
        ? // a recompute that doesn't match the expected installment
          sendData({ instal: "4999", instal_num: 4999, amount: "100000" })(
            route,
          )
        : // the initial cal (GET, after info)
          sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
            route,
          ),
    );
    await page.route(/\/api\/annuitySheet\/s1\/calAdjust(\?|$)/, (route) => {
      adjustCalled = true;
      return sendData({ instal: "5000", instal_num: 5000, amount: "100000" })(
        route,
      );
    });
    await page.goto(PARAM_URL);

    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect(page.getByText("真實保費與期望保費有偏差")).toBeVisible();
    await page.getByRole("button", { name: "調整" }).click();
    await expect.poll(() => adjustCalled).toBe(true);
  });

  test("type DEFERED: generate navigates to the annuity sheet route", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "DEFERED");
    await page.route(/\/api\/annuitySheet\/s1\/info(\?|$)/, sendData("ok"));
    await page.route(
      /\/api\/annuitySheet\/s1\/cal(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.goto(PARAM_URL);

    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect(page.getByText("USD$ 5000")).toBeVisible();
    await page.getByRole("button", { name: "生成報表" }).click();
    await expect(page).toHaveURL(
      /\/plans\/annuity\/sheet\?planId=p1&sheetId=s1/,
    );
  });

  test("the info button opens a dialog with the plan info", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "DEFERED");
    await page.goto(PARAM_URL);
    await page.getByRole("button", { name: "提示" }).click();
    await expect(
      page.getByRole("dialog").getByText("計劃詳情說明"),
    ).toBeVisible();
  });
});
