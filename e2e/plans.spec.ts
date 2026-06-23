import { expect, test, type Page, type Route } from "@playwright/test";

type PlanRow = {
  _id: string;
  name: string;
  info: string;
  bg: string;
  insuranceCompanyDetail: { _id: string; name: string; bg: string };
};

const plan = (id: string, name: string): PlanRow => ({
  _id: id,
  name,
  // Fixed subtitle that doesn't contain the title, so getByText(name) is unambiguous.
  info: "1年交 – 最早提取為第1年",
  bg: "",
  insuranceCompanyDetail: { _id: `co-${id}`, name: "友記", bg: "#8e1f3d" },
});

const COMPANIES = [
  { _id: "c1", name: "宏記", bg: "#2f7d32" },
  { _id: "c2", name: "保記", bg: "#e03131" },
];

/** Fulfill a route with the API's `{ data }` envelope. */
const sendData = (data: unknown) => (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });

/** Drop a wv_token cookie so the middleware + client treat the page as signed in. */
async function authenticate(page: Page) {
  await page.context().addCookies([
    { name: "wv_token", value: "test-jwt", domain: "localhost", path: "/" },
  ]);
}

test.describe("/plans", () => {
  test("redirects to /unauthorized when the token is missing", async ({
    page,
  }) => {
    const res = await page.goto("/zh-HK/plans");
    await expect(page).toHaveURL(/\/zh-HK\/unauthorized$/);
    expect(res?.ok()).toBeTruthy();
  });

  test("is allowed through during a ?code= hand-off", async ({ page }) => {
    await page.route(/\/loginCode\/exchange/, sendData({ token: "test-jwt" }));
    await page.route(/\/api\/plan(\?|$)/, sendData([]));
    await page.goto("/zh-HK/plans?code=abc");
    await expect(page).toHaveURL(/\/zh-HK\/plans/);
    await expect(page).not.toHaveURL(/unauthorized/);
  });

  test("renders the plans list for the active tab", async ({ page }) => {
    await authenticate(page);
    await page.route(
      /\/api\/plan(\?|$)/,
      sendData([plan("1", "財F盈活"), plan("2", "駿譽財F")]),
    );
    await page.goto("/zh-HK/plans");

    await expect(page.getByText("財F盈活")).toBeVisible();
    await expect(page.getByText("駿譽財F")).toBeVisible();
    await expect(page.getByText("友記").first()).toBeVisible(); // company badge
  });

  test("switching tabs updates ?tab= and queries the matching endpoint", async ({
    page,
  }) => {
    await authenticate(page);
    await page.route(/\/api\/plan(\?|$)/, sendData([plan("1", "Savings A")]));
    await page.route(
      /\/api\/couponPlan(\?|$)/,
      sendData([plan("9", "Dividend B")]),
    );
    await page.goto("/zh-HK/plans");
    await expect(page.getByText("Savings A")).toBeVisible();

    await page.getByRole("button", { name: "派息" }).click();
    await expect(page).toHaveURL(/[?&]tab=dividend/);
    await expect(page.getByText("Dividend B")).toBeVisible();
  });

  test("search updates ?search= and is sent to the API", async ({ page }) => {
    await authenticate(page);
    let lastSearch: string | null = null;
    await page.route(/\/api\/plan(\?|$)/, (route) => {
      lastSearch = new URL(route.request().url()).searchParams.get("search");
      return sendData([])(route);
    });
    await page.goto("/zh-HK/plans");

    await page.getByPlaceholder("搜尋保險產品").fill("friend");
    await expect(page).toHaveURL(/[?&]search=friend/);
    await expect.poll(() => lastSearch).toBe("friend");
  });

  test("company filter sets ?company= and insuranceCompanyId", async ({
    page,
  }) => {
    await authenticate(page);
    let lastCompany: string | null = null;
    await page.route(/\/api\/plan(\?|$)/, (route) => {
      lastCompany = new URL(route.request().url()).searchParams.get(
        "insuranceCompanyId",
      );
      return sendData([])(route);
    });
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    await page.goto("/zh-HK/plans");

    await page.getByRole("button", { name: /篩選/ }).click();
    await expect(page.getByText("選擇保險公司")).toBeVisible();
    await page.getByRole("button", { name: "保記" }).click();

    await expect(page).toHaveURL(/[?&]company=c2/);
    await expect.poll(() => lastCompany).toBe("c2");
  });

  test("infinite scroll fetches the next page on scroll", async ({ page }) => {
    await authenticate(page);
    const firstPage = Array.from({ length: 20 }, (_, i) =>
      plan(String(i), `Plan ${i}`),
    );
    await page.route(/\/api\/plan(\?|$)/, (route) => {
      const skip = Number(
        new URL(route.request().url()).searchParams.get("skip") ?? "0",
      );
      return sendData(skip === 0 ? firstPage : [plan("100", "Plan 100")])(route);
    });
    await page.goto("/zh-HK/plans");
    await expect(page.getByText("Plan 0", { exact: true })).toBeVisible();

    await page.getByText("Plan 19", { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByText("Plan 100", { exact: true })).toBeVisible();
  });
});
