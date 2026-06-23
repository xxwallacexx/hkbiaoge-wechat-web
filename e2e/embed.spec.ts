import { expect, test } from "@playwright/test";

// Force an unsupported browser language so the bare `/` exercises the DEFAULT
// locale fallback (zh-CN) instead of Accept-Language detection. The other tests
// visit explicit /zh-CN and /en paths, so this locale doesn't affect them.
test.use({ locale: "fr-FR" });

test("root redirects to the default locale", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  expect(page.url()).toContain("/zh-CN");
});

test("exchanges a one-time code from the web-view URL for a token cookie", async ({
  page,
}) => {
  // The web-view opens with ?code=...; the app trades it for a JWT via
  // POST /loginCode/exchange and stores it in the wv_token cookie. Mock the
  // exchange so the test needs no backend.
  await page.route(/\/loginCode\/exchange$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { token: "test-jwt", tokenExp: null } }),
    }),
  );

  await page.goto("/zh-CN?code=test-code");

  // The one-time code is stripped from the address bar immediately.
  await expect(page).toHaveURL(/\/zh-CN(\?|$)/);

  // Once the exchange resolves, the returned JWT lands in the cookie.
  await expect
    .poll(
      async () =>
        (await page.context().cookies()).find((c) => c.name === "wv_token")
          ?.value,
    )
    .toBe("test-jwt");
});

test("renders the localized title", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "Insurance Plans" }),
  ).toBeVisible();
});
