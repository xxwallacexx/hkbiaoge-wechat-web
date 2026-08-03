import { expect, test, type Page, type Route } from "@playwright/test";

type CompanyRow = {
  _id: string;
  name: string;
  realName: string;
  bg: string;
  officialWebsiteUrl?: string | null;
  fulfillmentRatioUrl?: string | null;
};

const COMPANIES: CompanyRow[] = [
  {
    _id: "c1",
    name: "友記全稱",
    realName: "友記",
    bg: "#8e1f3d",
    officialWebsiteUrl: "https://example.com/you",
    fulfillmentRatioUrl: "https://example.com/you-ratio",
  },
  {
    _id: "c2",
    name: "宏記全稱",
    realName: "宏記",
    bg: "#2f7d32",
    officialWebsiteUrl: "https://example.com/wang",
    fulfillmentRatioUrl: null,
  },
  {
    _id: "c3",
    name: "保記全稱",
    realName: "保記",
    bg: "#e03131",
    officialWebsiteUrl: null,
    fulfillmentRatioUrl: null,
  },
];

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

test.describe("/insuranceCompanies", () => {
  test("redirects to /unauthorized when the token is missing", async ({
    page,
  }) => {
    const res = await page.goto("/zh-HK/insuranceCompanies");
    await expect(page).toHaveURL(/\/zh-HK\/unauthorized$/);
    expect(res?.ok()).toBeTruthy();
  });

  test("is allowed through during a ?code= hand-off", async ({ page }) => {
    await page.route(/\/loginCode\/exchange/, sendData({ token: "test-jwt" }));
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData([]));
    await page.goto("/zh-HK/insuranceCompanies?code=abc");
    await expect(page).toHaveURL(/\/zh-HK\/insuranceCompanies/);
    await expect(page).not.toHaveURL(/unauthorized/);
  });

  test("renders a tile per company", async ({ page }) => {
    await authenticate(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    await page.goto("/zh-HK/insuranceCompanies");

    await expect(page.getByText("友記", { exact: true })).toBeVisible();
    await expect(page.getByText("宏記", { exact: true })).toBeVisible();
    await expect(page.getByText("保記", { exact: true })).toBeVisible();
  });

  test("renders a link button only for the urls a company has", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    await page.goto("/zh-HK/insuranceCompanies");
    await expect(page.getByText("友記", { exact: true })).toBeVisible();

    // 友記 has both urls, 宏記 only a website, 保記 neither.
    await expect(page.getByRole("button", { name: "網頁" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "達成率" })).toHaveCount(1);
  });

  test("shows the empty state when there are no companies", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData([]));
    await page.goto("/zh-HK/insuranceCompanies");

    await expect(page.getByText("暫無保險公司")).toBeVisible();
  });

  test("surfaces a load failure", async ({ page }) => {
    await authenticate(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, (route) =>
      route.fulfill({ status: 500, body: "boom" }),
    );
    await page.goto("/zh-HK/insuranceCompanies");

    await expect(page.getByText("載入保險公司失敗")).toBeVisible();
  });

  test("a link opens in a new tab outside WeChat", async ({
    page,
    context,
  }) => {
    await authenticate(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    // The fixture host does not resolve; stub it so the popup's navigation settles.
    await context.route(/example\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<p>ok</p>",
      }),
    );
    await page.goto("/zh-HK/insuranceCompanies");

    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: "達成率" }).click(),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toBe("https://example.com/you-ratio");
  });
});
