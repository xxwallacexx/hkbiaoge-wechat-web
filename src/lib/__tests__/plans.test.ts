import { describe, expect, it } from "vitest";

import { DEFAULT_TAB, PLAN_TABS, resolveTab } from "@/lib/plans";

describe("resolveTab", () => {
  it("resolves a known tab key to its config", () => {
    const dividend = PLAN_TABS.find((t) => t.key === "dividend");
    expect(resolveTab("dividend")).toBe(dividend);
    expect(resolveTab("dividend").endpoint).toBe("/couponPlan");
  });

  it("falls back to the default tab for unknown / missing keys", () => {
    expect(DEFAULT_TAB.key).toBe("savings");
    expect(resolveTab("nope")).toBe(DEFAULT_TAB);
    expect(resolveTab(null)).toBe(DEFAULT_TAB);
    expect(resolveTab(undefined)).toBe(DEFAULT_TAB);
  });
});
