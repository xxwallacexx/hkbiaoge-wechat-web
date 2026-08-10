import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * The saving sheet's header: the plan name and the PDF download. The download is the only
 * behaviour worth an e2e — it spans a mutation, an OSS host rewrite and a popup, none of
 * which a unit test can observe end to end. The other five sheets mount the same
 * `SheetHeader` with the same `useSheetPdf`, so they are covered by types + the unit tests
 * for `openPdf`.
 */

const detail = {
  _id: "p1",
  name: "儲蓄計劃A",
  info: "計劃詳情說明",
  bg: "#123456",
  price: 0,
  paymentDetail: {
    _id: "pay1",
    completedAt: "2026-01-01T00:00:00Z",
    expiredAt: "2030-01-01T00:00:00Z",
  },
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
  premiumHeaders: ["年度", "年齡", "總保費"],
  deathHeaders: ["年度", "年齡", "身故賠償"],
  infoCell: "",
  infoRange: "",
  withdrawalCol: "",
  withdrawalLength: 0,
  createdAt: "",
  updatedAt: "",
};

// One worksheet row: the transform slices columns [0,7) + [11,12) for premium.
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

const personalInfo = {
  name: "Tester",
  sex: "男",
  age: 30,
  period: 5,
  currency: "USD",
  amount: 100000,
  instal: "5000",
};

const cal = { instal: "5000", instal_num: 5000, amount: "100000" };

/** The url the API returns — on the bucket's own host, as the PDF service writes it. */
const BUCKET_PDF =
  "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/pdf/u1/Tester_USD_5000_1.pdf";
const ALIAS_PDF = "https://oss.hkbiaoge.com/pdf/u1/Tester_USD_5000_1.pdf";

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

async function mockReads(page: Page) {
  await page.route(/\/api\/plan\/p1\/status(\?|$)/, sendData(detail));
  await page.route(/\/api\/plan\/p1\/param(\?|$)/, sendData(param));
  await page.route(/\/api\/plan\/p1(\?|$)/, sendData(detail));
  await page.route(/\/api\/sheet\/s1\/data(\?|$)/, sendData(sheetData));
  await page.route(
    /\/api\/sheet\/s1\/personalInfo(\?|$)/,
    sendData(personalInfo),
  );
  await page.route(/\/api\/sheet\/s1\/cal(\?|$)/, sendData(cal));
}

const URL = "/zh-HK/plans/saving/sheet?planId=p1&sheetId=s1";

test.describe("/plans/saving/sheet — header + PDF", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await mockReads(page);
  });

  test("renders the plan name and the download button", async ({ page }) => {
    await page.goto(URL);

    await expect(
      page.getByRole("heading", { name: "儲蓄計劃A" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "下載計劃書" }),
    ).toBeVisible();
  });

  test("PUTs pdfGenerate and opens the rewritten url in a new tab", async ({
    page,
  }) => {
    let method: string | undefined;
    await page.route(/\/api\/sheet\/s1\/pdfGenerate(\?|$)/, (route) => {
      method = route.request().method();
      return sendData(BUCKET_PDF)(route);
    });
    await page.goto(URL);

    const popup = page.waitForEvent("popup");
    await page.getByRole("button", { name: "下載計劃書" }).click();

    // The Mini Program's allowlist only covers the custom domain — the bucket host must
    // never survive to a browser tab either. See lib/oss.ts.
    await (await popup).waitForURL(ALIAS_PDF, { timeout: 15_000 });
    expect(method).toBe("PUT");
  });

  test("shows the busy label while the PDF renders", async ({ page }) => {
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(/\/api\/sheet\/s1\/pdfGenerate(\?|$)/, async (route) => {
      await held;
      return sendData(BUCKET_PDF)(route);
    });
    await page.goto(URL);

    await page.getByRole("button", { name: "下載計劃書" }).click();
    const busy = page.getByRole("button", { name: "計劃書生成中" });
    await expect(busy).toBeVisible();
    await expect(busy).toBeDisabled();

    release?.();
  });

  test("toasts on failure", async ({ page }) => {
    await page.route(/\/api\/sheet\/s1\/pdfGenerate(\?|$)/, (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );
    await page.goto(URL);

    await page.getByRole("button", { name: "下載計劃書" }).click();
    await expect(page.getByText("計劃書生成失敗，請重試。")).toBeVisible();
  });
});
