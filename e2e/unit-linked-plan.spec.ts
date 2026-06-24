import { expect, test, type Page, type Route } from "@playwright/test";

const PAID = {
  paymentDetail: {
    _id: "pay1",
    completedAt: "2026-01-01T00:00:00Z",
    expiredAt: "2030-01-01T00:00:00Z",
  },
};

const detail = {
  _id: "p1",
  name: "指數相連計劃A",
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

const param = (planType: "A" | "B") => ({
  _id: "pm1",
  unitLinkedPlanId: "p1",
  periodOptions: [
    { value: "5", maxAge: 80 },
    { value: "10", maxAge: 70 },
  ],
  currencyOptions: ["USD", "HKD"],
  currentInterestRateOptions: ["3%", "5%"],
  minAge: 1,
  planType,
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

/** Mock the reads + basic-info GET/PUT; `planType` selects the A or B param flavour. */
async function mockReads(page: Page, planType: "A" | "B" = "A") {
  await page.route(/\/api\/unitLinkedPlan\/p1\/status(\?|$)/, sendData(detail));
  await page.route(
    /\/api\/unitLinkedPlan\/p1\/param(\?|$)/,
    sendData(param(planType)),
  );
  await page.route(/\/api\/unitLinkedPlan\/p1(\?|$)/, sendData(detail));
  await page.route(/\/api\/unitLinkedSheet\/s1\/basicInfo(\?|$)/, (route) =>
    route.request().method() === "PUT"
      ? sendData("ok")(route)
      : sendData(basicInfo)(route),
  );
}

const BASIC_URL = "/zh-HK/plans/unitLinked/basicInfo?planId=p1&sheetId=s1";
const PARAM_URL = "/zh-HK/plans/unitLinked/param?planId=p1&sheetId=s1";

test.describe("/plans/unitLinked (index-linked)", () => {
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
    await page.route(
      /\/api\/unitLinkedPlan\/p1\/status(\?|$)/,
      sendData(expired),
    );
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
      /\/plans\/unitLinked\/param\?planId=p1&sheetId=s1/,
    );
  });

  // ---- step 2: param + premium, TYPE A (single cal sheet) ----

  test("type A: param submit opens the cal sheet; /cal is a bare-number application/json body", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "A");
    let calBody: string | null = null;
    let calContentType: string | undefined;
    await page.route(
      /\/api\/unitLinkedSheet\/s1\/info(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.route(/\/api\/unitLinkedSheet\/s1\/cal(\?|$)/, (route) => {
      if (route.request().method() === "PUT") {
        calBody = route.request().postData();
        calContentType = route.request().headers()["content-type"];
      }
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

  test("type A: generate navigates to the unit-linked sheet route", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "A");
    await page.route(
      /\/api\/unitLinkedSheet\/s1\/info(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.route(
      /\/api\/unitLinkedSheet\/s1\/cal(\?|$)/,
      sendData({ instal: "5000", instal_num: 5000, amount: "100000" }),
    );
    await page.goto(PARAM_URL);
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByPlaceholder("輸入期望保費").fill("5000");
    await expect(page.getByText("USD$ 5000")).toBeVisible();
    await page.getByRole("button", { name: "生成報表" }).click();
    await expect(page).toHaveURL(
      /\/plans\/unitLinked\/sheet\?planId=p1&sheetId=s1/,
    );
  });

  // ---- step 2: param + premium, TYPE B (amount → range → installment) ----

  test("type B: amount → premium range → next → install → generate (bare-number application/json)", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "B");
    let amountBody: string | null = null;
    let amountCt: string | undefined;
    let installBody: string | null = null;
    let installCt: string | undefined;
    await page.route(
      /\/api\/unitLinkedSheet\/s1\/info(\?|$)/,
      sendData({ instal: "0", instal_num: 0, amount: "0" }),
    );
    await page.route(/\/api\/unitLinkedSheet\/s1\/amount(\?|$)/, (route) => {
      if (route.request().method() === "PUT") {
        amountBody = route.request().postData();
        amountCt = route.request().headers()["content-type"];
      }
      return sendData({
        estimatedInstal: 100,
        maxInstal: 200,
        amount: "100000",
      })(route);
    });
    await page.route(/\/api\/unitLinkedSheet\/s1\/install(\?|$)/, (route) => {
      if (route.request().method() === "PUT") {
        installBody = route.request().postData();
        installCt = route.request().headers()["content-type"];
      }
      return sendData("ok")(route);
    });
    await page.goto(PARAM_URL);

    // Submit the param form → opens the type-B amount sheet.
    await page.getByRole("button", { name: "下一步" }).click();
    await page.getByPlaceholder("輸入保額").fill("100000");
    await expect.poll(() => amountBody).toBe("100000");
    expect(amountCt).toContain("application/json");
    // The premium range from /amount is shown.
    await expect(page.getByText("USD$ 100 - USD$ 200")).toBeVisible();

    // "Next" (scoped to the open sheet, not the param form's identical button) → install sheet.
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "下一步" }).click();

    // Installment sheet: pick a value within [100, 200], then generate.
    await page.getByPlaceholder("輸入投保金額").fill("150");
    await page.getByRole("button", { name: "生成報表" }).click();
    await expect.poll(() => installBody).toBe("150");
    expect(installCt).toContain("application/json");
    await expect(page).toHaveURL(
      /\/plans\/unitLinked\/sheet\?planId=p1&sheetId=s1/,
    );
  });

  test("the info button opens a dialog with the plan info", async ({
    page,
  }) => {
    await authenticate(page);
    await mockReads(page, "A");
    await page.goto(PARAM_URL);
    await page.getByRole("button", { name: "提示" }).click();
    await expect(
      page.getByRole("dialog").getByText("計劃詳情說明"),
    ).toBeVisible();
  });
});
