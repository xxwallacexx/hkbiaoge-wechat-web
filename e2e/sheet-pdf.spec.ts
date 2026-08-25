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

/**
 * The generated-sheet params, asserted where they actually travel.
 *
 * Everything above opens a real tab, and the plain-browser path has no receiver for `meta` —
 * so the params only exist on the Mini Program branch. WeChat is emulated rather than run:
 * `isMiniProgramSync` reads the user agent, and `withMiniProgram` short-circuits the SDK load
 * when `window.wx.miniProgram` is already present, so a UA plus one init script is the whole
 * environment. The stub records the url instead of navigating.
 *
 * An 年金 GENERAL sheet is the subject because it fills the most of `PdfMeta`: no cal (so no
 * 保费金额 at all), an entered 名義金額, and both the single and couple annuity editors.
 */
test.describe("/plans/annuity/sheet — the Mini Program hand-off", () => {
  // `micromessenger` passes the WeChat check, `miniprogram` the web-view one.
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "MicroMessenger/8.0.49 miniProgram",
  });

  const GENERAL_PARAM = {
    _id: "pm1",
    annuityPlanType: "GENERAL",
    currencyOptions: ["USD"],
    minAge: 1,
    maxAge: 80,
    headers: ["年度", "年齡", "總保費"],
    withdrawalCol: "K",
    isAnnuityAgeFreeInput: true,
    annuityAgeOptions: [],
    annuityConstraint: { minAge: 50, maxAge: 80 },
    annuityTypeOptions: ["終身年金"],
    coupleAnnuityTypeOptions: ["聯合年金"],
    createdAt: "",
    updatedAt: "",
  };

  /** Capture `navigateTo` instead of leaving the page. */
  async function stubMiniProgram(page: Page) {
    // The layout loads the real jweixin in the document head, and it assigns `window.wx`
    // itself — which would replace the stub below with an SDK that routes every call into a
    // WeixinJSBridge that does not exist here, dropping it with no error. Serve nothing in
    // its place: `loadJWeixin` short-circuits on `window.wx.miniProgram` regardless.
    await page.route(/res\.wx\.qq\.com\/.*jweixin/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "",
      }),
    );
    await page.addInitScript(() => {
      (window as unknown as { __navigations: string[] }).__navigations = [];
      (window as unknown as { wx: unknown }).wx = {
        miniProgram: {
          navigateTo: ({ url }: { url: string }) =>
            (
              window as unknown as { __navigations: string[] }
            ).__navigations.push(url),
        },
      };
    });
  }

  /** Route the GENERAL sheet, with the two display-type flags under test. */
  async function mockSheet(
    page: Page,
    { isAnnuityEnabled, isCoupleAnnuityEnabled } = {
      isAnnuityEnabled: true,
      isCoupleAnnuityEnabled: true,
    },
  ) {
    await page.route(
      /\/api\/annuityPlan\/p1\/status(\?|$)/,
      sendData(detail("盈月年金計劃")),
    );
    await page.route(
      /\/api\/annuityPlan\/p1\/param(\?|$)/,
      sendData(GENERAL_PARAM),
    );
    await page.route(
      /\/api\/annuityPlan\/p1(\?|$)/,
      sendData(detail("盈月年金計劃")),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/data(\?|$)/,
      sendData(sheetData),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/basicInfo(\?|$)/,
      sendData(basicInfo),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/info(\?|$)/,
      sendData({ period: "5", amount: "100000", currency: "USD" }),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/annuityInfo(\?|$)/,
      sendData({ annuityOption: "終身年金", annuityAge: 65 }),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/coupleAnnuityInfo(\?|$)/,
      sendData({ coupleAnnuityOption: "聯合年金", coupleAnnuityAge: 60 }),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/(couple)?[aA]nnuityReceivable(\?|$)/,
      sendData([]),
    );
    await page.route(
      /\/api\/annuitySheet\/s1\/pdfGenerate(\?|$)/,
      sendData(BUCKET_PDF),
    );
    // The display-type flags live on the sheet doc root, so this must come last: it is the
    // least specific pattern, and Playwright tries the most recently registered route first.
    await page.route(
      /\/api\/annuitySheet\/s1(\?|$)/,
      sendData({ isAnnuityEnabled, isCoupleAnnuityEnabled }),
    );
  }

  /** The url the stub recorded, once one arrives. */
  async function navigatedUrl(page: Page) {
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as unknown as { __navigations: string[] }).__navigations
                .length,
          ),
        { timeout: 15_000 },
      )
      .toBe(1);
    return page.evaluate(
      () => (window as unknown as { __navigations: string[] }).__navigations[0],
    );
  }

  test("hands the native viewer page the whole sheet", async ({ page }) => {
    await authenticate(page);
    await stubMiniProgram(page);
    await mockSheet(page);

    await page.goto("/zh-HK/plans/annuity/sheet?planId=p1&sheetId=s1");
    await page.getByRole("button", { name: "下載計劃書" }).click();

    const url = await navigatedUrl(page);
    const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));

    expect(params.get("source")).toBe("plan");
    expect(params.get("customerName")).toBe("Tester");
    expect(params.get("companyName")).toBe("友記");
    expect(params.get("planName")).toBe("盈月年金計劃");
    expect(params.get("sex")).toBe("男");
    expect(params.get("age")).toBe("30");
    expect(params.get("amount")).toBe("100000");
    expect(params.get("currency")).toBe("USD");
    expect(params.get("period")).toBe("5");
    expect(params.get("annuityAge")).toBe("65");
    expect(params.get("annuityOption")).toBe("終身年金");
    expect(params.get("coupleAnnuityAge")).toBe("60");
    expect(params.get("coupleAnnuityOption")).toBe("聯合年金");
    // GENERAL never loads a cal, so it has no 保费金额 — absent, not blank.
    expect(params.has("instal")).toBe(false);
    // The PDF itself is still handed over on the rewritten host.
    expect(params.get("url")).toBe(ALIAS_PDF);
  });

  // The switches decide whether the 年金 block is on the generated sheet at all, so a url that
  // named a selection while the block was off would describe a document that does not exist.
  test("omits the annuity params when their display switch is off", async ({
    page,
  }) => {
    await authenticate(page);
    await stubMiniProgram(page);
    await mockSheet(page, {
      isAnnuityEnabled: false,
      isCoupleAnnuityEnabled: false,
    });

    await page.goto("/zh-HK/plans/annuity/sheet?planId=p1&sheetId=s1");
    await page.getByRole("button", { name: "下載計劃書" }).click();

    const params = new URLSearchParams(
      (await navigatedUrl(page)).split("?")[1],
    );

    expect(params.has("annuityAge")).toBe(false);
    expect(params.has("annuityOption")).toBe(false);
    expect(params.has("coupleAnnuityAge")).toBe(false);
    expect(params.has("coupleAnnuityOption")).toBe(false);
    // The rest of the sheet is unaffected.
    expect(params.get("customerName")).toBe("Tester");
    expect(params.get("companyName")).toBe("友記");
  });
});
