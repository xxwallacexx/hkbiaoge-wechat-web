import { expect, test, type Page, type Route } from "@playwright/test";

type PromotionRow = {
  _id: string;
  name: string;
  path: string;
  insuranceCompanyDetail: { _id: string; realName: string; bg: string } | null;
};

const promotion = (id: string, name: string): PromotionRow => ({
  _id: id,
  name,
  path: `https://cdn.example.com/${id}.pdf`,
  insuranceCompanyDetail: { _id: `co-${id}`, realName: "友記", bg: "#8e1f3d" },
});

const COMPANIES = [
  { _id: "c1", name: "宏記全稱", realName: "宏記", bg: "#2f7d32" },
  { _id: "c2", name: "保記全稱", realName: "保記", bg: "#e03131" },
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

test.describe("/promotions", () => {
  test("redirects to /unauthorized when the token is missing", async ({
    page,
  }) => {
    const res = await page.goto("/zh-HK/promotions");
    await expect(page).toHaveURL(/\/zh-HK\/unauthorized$/);
    expect(res?.ok()).toBeTruthy();
  });

  test("is allowed through during a ?code= hand-off", async ({ page }) => {
    await page.route(/\/loginCode\/exchange/, sendData({ token: "test-jwt" }));
    await page.route(/\/api\/promotion(\?|$)/, sendData([]));
    await page.goto("/zh-HK/promotions?code=abc");
    await expect(page).toHaveURL(/\/zh-HK\/promotions/);
    await expect(page).not.toHaveURL(/unauthorized/);
  });

  test("renders the promotion list", async ({ page }) => {
    await authenticate(page);
    await page.route(
      /\/api\/promotion(\?|$)/,
      sendData([
        promotion("1", "首季保費折扣優惠"),
        promotion("2", "新客戶首年 8 折"),
      ]),
    );
    await page.goto("/zh-HK/promotions");

    await expect(page.getByText("首季保費折扣優惠")).toBeVisible();
    await expect(page.getByText("新客戶首年 8 折")).toBeVisible();
    await expect(page.getByText("友記").first()).toBeVisible(); // company badge
  });

  test("shows the empty state when there are no promotions", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(/\/api\/promotion(\?|$)/, sendData([]));
    await page.goto("/zh-HK/promotions");

    await expect(page.getByText("暫無優惠推廣")).toBeVisible();
  });

  test("renders a promotion whose company lookup came back null", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(
      /\/api\/promotion(\?|$)/,
      sendData([
        { ...promotion("1", "孤兒推廣"), insuranceCompanyDetail: null },
      ]),
    );
    await page.goto("/zh-HK/promotions");

    await expect(page.getByText("孤兒推廣")).toBeVisible();
  });

  test("company filter sets ?company= and insuranceCompanyId", async ({
    page,
  }) => {
    await authenticate(page);
    let lastCompany: string | null = null;
    await page.route(/\/api\/promotion(\?|$)/, (route) => {
      lastCompany = new URL(route.request().url()).searchParams.get(
        "insuranceCompanyId",
      );
      return sendData([])(route);
    });
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    await page.goto("/zh-HK/promotions");

    await page.getByRole("button", { name: /篩選/ }).click();
    await expect(page.getByText("選擇保險公司")).toBeVisible();
    await page.getByRole("button", { name: "保記" }).click();

    await expect(page).toHaveURL(/[?&]company=c2/);
    await expect.poll(() => lastCompany).toBe("c2");
  });

  test("infinite scroll fetches the next page on scroll", async ({ page }) => {
    await authenticate(page);
    const firstPage = Array.from({ length: 20 }, (_, i) =>
      promotion(String(i), `優惠 ${i}`),
    );
    await page.route(/\/api\/promotion(\?|$)/, (route) => {
      const skip = Number(
        new URL(route.request().url()).searchParams.get("skip") ?? "0",
      );
      return sendData(skip === 0 ? firstPage : [promotion("100", "優惠 100")])(
        route,
      );
    });
    await page.goto("/zh-HK/promotions");
    await expect(page.getByText("優惠 0", { exact: true })).toBeVisible();

    await page.getByText("優惠 19", { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText("優惠 100", { exact: true })).toBeVisible();
  });

  test("tapping a row opens the promotion PDF in a new tab outside WeChat", async ({
    page,
    context,
  }) => {
    await authenticate(page);
    await page.route(
      /\/api\/promotion(\?|$)/,
      sendData([promotion("1", "首季保費折扣優惠")]),
    );
    // The fixture CDN host does not resolve; stub it on the context so the popup's own
    // navigation succeeds and its final url can be asserted.
    await context.route(/cdn\.example\.com/, (route) =>
      route.fulfill({ status: 200, contentType: "text/plain", body: "%PDF-" }),
    );
    await page.goto("/zh-HK/promotions");

    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: /首季保費折扣優惠/ }).click(),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toBe("https://cdn.example.com/1.pdf");
  });

  // The stored url points at the OSS bucket's shared host, which can never be a WeChat
  // 业务域名; it has to come out on the custom domain aliased onto that bucket. See
  // src/lib/oss.ts.
  test("rewrites an OSS bucket url onto the custom domain", async ({
    page,
    context,
  }) => {
    await authenticate(page);
    await page.route(
      /\/api\/promotion(\?|$)/,
      sendData([
        {
          ...promotion("1", "首季保費折扣優惠"),
          path: "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/assets/1.pdf",
        },
      ]),
    );
    // Stub the alias on the context so the popup's own navigation resolves and its final
    // url can be asserted. The bucket host is deliberately NOT stubbed: a request there
    // would mean the rewrite did not happen.
    await context.route(/oss\.hkbiaoge\.com/, (route) =>
      route.fulfill({ status: 200, contentType: "text/plain", body: "%PDF-" }),
    );
    await page.goto("/zh-HK/promotions");

    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("button", { name: /首季保費折扣優惠/ }).click(),
    ]);
    await popup.waitForLoadState();
    expect(popup.url()).toBe("https://oss.hkbiaoge.com/assets/1.pdf");
  });
});
