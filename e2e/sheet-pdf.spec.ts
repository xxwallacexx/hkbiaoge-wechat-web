import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * The header + PDF download on the other five sheets. Saving has its own spec
 * (`saving-plan-sheet.spec.ts`) with the busy/error cases; the shared `SheetHeader` and
 * `useSheetPdf` behave identically everywhere, so what these assert is the per-plan wiring:
 * the right screen calls the right endpoint, and the url it opens is on the rewritten host.
 */

const PAID = {
  paymentDetail: {
    _id: "pay1",
    completedAt: "2026-01-01T00:00:00Z",
    expiredAt: "2030-01-01T00:00:00Z",
  },
};

const detail = (name: string) => ({
  _id: "p1",
  name,
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
});

const basicInfo = { name: "Tester", sex: "男", age: 30 };
const cal = { instal: "5000", instal_num: 5000, amount: "100000" };

// A 12-column worksheet row: enough for every plan's slicing to produce one table row.
const sheetData = [
  [
    "1",
    "31",
    "5,000",
    "1,120",
    "0",
    "0",
    "1,120",
    "6,000",
    "0",
    "0",
    "6,000",
    "",
  ],
];

const BUCKET_PDF =
  "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/pdf/u1/Tester_USD_5000_1.pdf";
const ALIAS_PDF = "https://oss.hkbiaoge.com/pdf/u1/Tester_USD_5000_1.pdf";

const COMMON_PARAM = {
  _id: "pm1",
  periodOptions: [{ value: "5", maxAge: 80 }],
  currencyOptions: ["USD", "HKD"],
  premiumHeaders: ["年度", "年齡", "總保費"],
  deathHeaders: ["年度", "年齡", "身故賠償"],
  minAge: 1,
  createdAt: "",
  updatedAt: "",
};

/** One row per remaining plan: where it lives, what it fetches, what it is called. */
const PLANS = [
  {
    label: "wholelife",
    route: "wholelife",
    planPrefix: "wholelifePlan",
    sheetPrefix: "wholelifeSheet",
    name: "人壽計劃A",
    param: { ...COMMON_PARAM, healthOptions: [], areaOptions: [] },
    sheetInfo: { period: "5", health: "標準", area: "亞洲", currency: "USD" },
  },
  {
    label: "ci",
    route: "ci",
    planPrefix: "ciPlan",
    sheetPrefix: "ciSheet",
    name: "危疾計劃A",
    param: { ...COMMON_PARAM, healthOptions: [], areaOptions: [] },
    sheetInfo: { period: "5", health: "標準", area: "亞洲", currency: "USD" },
  },
  {
    label: "coupon",
    route: "coupon",
    planPrefix: "couponPlan",
    sheetPrefix: "couponSheet",
    name: "派息計劃A",
    param: { ...COMMON_PARAM, dividendOptions: ["累積"] },
    sheetInfo: { period: "5", currency: "USD", dividend: "累積" },
  },
  {
    label: "annuity",
    route: "annuity",
    planPrefix: "annuityPlan",
    sheetPrefix: "annuitySheet",
    name: "年金計劃A",
    // DEFERED (not GENERAL) so the screen takes the two-tab branch; the sheet reads
    // `annuityAgeOptions` unconditionally, so it has to be present.
    param: {
      ...COMMON_PARAM,
      annuityPlanType: "DEFERED",
      annuityAgeOptions: [],
      maxAge: 80,
    },
    sheetInfo: { period: "5", currency: "USD" },
  },
  {
    label: "unitLinked",
    route: "unitLinked",
    planPrefix: "unitLinkedPlan",
    sheetPrefix: "unitLinkedSheet",
    name: "指數相連計劃A",
    // Unit-linked renders ONE table off `headers` rather than the premium/death split.
    param: {
      ...COMMON_PARAM,
      planType: "A",
      headers: ["年度", "年齡", "總保費"],
      currentInterestRateOptions: ["3%"],
    },
    sheetInfo: { period: "5", currency: "USD", currentInterestRate: "3%" },
  },
] as const;

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

for (const plan of PLANS) {
  const { label, route, planPrefix, sheetPrefix, name, param, sheetInfo } =
    plan;
  const url = `/zh-HK/plans/${route}/sheet?planId=p1&sheetId=s1`;

  test.describe(`/plans/${route}/sheet — header + PDF`, () => {
    test.beforeEach(async ({ page }) => {
      await authenticate(page);
      await page.route(
        new RegExp(`/api/${planPrefix}/p1/status(\\?|$)`),
        sendData(detail(name)),
      );
      await page.route(
        new RegExp(`/api/${planPrefix}/p1/param(\\?|$)`),
        sendData(param),
      );
      await page.route(
        new RegExp(`/api/${planPrefix}/p1(\\?|$)`),
        sendData(detail(name)),
      );
      await page.route(
        new RegExp(`/api/${sheetPrefix}/s1/data(\\?|$)`),
        sendData(sheetData),
      );
      await page.route(
        new RegExp(`/api/${sheetPrefix}/s1/basicInfo(\\?|$)`),
        sendData(basicInfo),
      );
      await page.route(
        new RegExp(`/api/${sheetPrefix}/s1/info(\\?|$)`),
        sendData(sheetInfo),
      );
      await page.route(
        new RegExp(`/api/${sheetPrefix}/s1/cal(\\?|$)`),
        sendData(cal),
      );
    });

    test(`${label}: renders the plan name and the download button`, async ({
      page,
    }) => {
      await page.goto(url);

      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "下載計劃書" }),
      ).toBeVisible();
    });

    test(`${label}: PUTs its own pdfGenerate and opens the rewritten url`, async ({
      page,
    }) => {
      let hit: { method: string; path: string } | undefined;
      await page.route(
        new RegExp(`/api/${sheetPrefix}/s1/pdfGenerate(\\?|$)`),
        (r) => {
          hit = {
            method: r.request().method(),
            path: new URL(r.request().url()).pathname,
          };
          return sendData(BUCKET_PDF)(r);
        },
      );
      await page.goto(url);

      const popup = page.waitForEvent("popup");
      await page.getByRole("button", { name: "下載計劃書" }).click();

      await (await popup).waitForURL(ALIAS_PDF, { timeout: 15_000 });
      expect(hit).toEqual({
        method: "PUT",
        path: `/api/${sheetPrefix}/s1/pdfGenerate`,
      });
    });
  });
}
