import { expect, test, type Page, type Route } from "@playwright/test";

type PlanRow = {
  _id: string;
  name: string;
  info: string;
  bg: string;
  insuranceCompanyDetail: { _id: string; name: string; bg: string };
};

const BADGES = [
  { name: "友記", bg: "#8e1f3d" },
  { name: "保記", bg: "#e03131" },
  { name: "衛記", bg: "#d9803a" },
  { name: "周記", bg: "#0f9b8e" },
  { name: "萬記", bg: "#16335b" },
  { name: "蘇記", bg: "#2f6db0" },
];

// Fixed sample list (stable names/subtitles/badge colors → stable pixels).
const PLANS: PlanRow[] = (
  [
    ["財F盈活", "1年交 – 最早提取為第1年 – 最早部份提取…"],
    ["駿譽財F", "3年交 – 最早提為第4年 – 最早部份提取…"],
    ["智Y超凡", "1年交 – 最早提為第1年 – 最早部份提取…"],
    ["匠X飛越", "1年交 – 最早提為第1年 – 最早部份提取…"],
    ["特級雋S2", "1年交 – 最早提為第1年 – 最早部份提取…"],
    ["富R傳家", "1年交 – 最早提為第1年 – 最早部份提取…"],
    ["瑞Y儲蓄計劃", "2年交 – 最早提為第3年 – 最早部份提取…"],
    ["富R盈家", "1年交 – 最早提為第1年 – 最早部份提取…"],
  ] as const
).map(([name, info], i) => ({
  _id: String(i + 1),
  name,
  info,
  bg: "",
  insuranceCompanyDetail: { _id: `co${i}`, ...BADGES[i % BADGES.length] },
}));

const COMPANIES = [
  { _id: "c1", name: "宏記", bg: "#2f7d32" },
  { _id: "c2", name: "保記", bg: "#e03131" },
  { _id: "c3", name: "衛記", bg: "#d9803a" },
  { _id: "c4", name: "盛記", bg: "#16335b" },
  { _id: "c5", name: "國記", bg: "#2f9e44" },
  { _id: "c6", name: "永記", bg: "#f0a020" },
  { _id: "c7", name: "達記", bg: "#e91e8c" },
  { _id: "c8", name: "立記", bg: "#a3b81e" },
];

const sendData = (data: unknown) => (route: Route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });

/** Signed-in state with the plans list mocked. */
async function authedPlans(page: Page) {
  await page.context().addCookies([
    { name: "wv_token", value: "test-jwt", domain: "localhost", path: "/" },
  ]);
  await page.route(/\/api\/plan(\?|$)/, sendData(PLANS));
}

const DEVICES = [
  { name: "iphone-xr", viewport: { width: 414, height: 896 } },
  { name: "ipad-air", viewport: { width: 820, height: 1180 } },
];

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      viewport: device.viewport,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    test("plans list", async ({ page }) => {
      await authedPlans(page);
      await page.goto("/zh-HK/plans");
      await expect(page.getByText("財F盈活")).toBeVisible();
      await expect(page).toHaveScreenshot(`plans-list-${device.name}.png`);
    });
  });
}

test.describe("iphone-xr — filter sheet", () => {
  test.use({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test("company filter sheet open", async ({ page }) => {
    await authedPlans(page);
    await page.route(/\/api\/insuranceCompany(\?|$)/, sendData(COMPANIES));
    await page.goto("/zh-HK/plans");
    await expect(page.getByText("財F盈活")).toBeVisible();

    await page.getByRole("button", { name: /篩選/ }).click();
    await expect(page.getByText("選擇保險公司")).toBeVisible();
    await expect(page.getByRole("button", { name: "宏記" })).toBeVisible();

    await expect(page).toHaveScreenshot("plans-filter-iphone-xr.png");
  });
});
