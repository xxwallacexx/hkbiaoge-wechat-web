import { describe, expect, it } from "vitest";

import { getCiPlanStatus } from "@/lib/api/ci-plans";
import { getSavingPlanStatus } from "@/lib/api/saving-plans";
import { PLAN_TABS } from "@/lib/plans";
import { resolveSheetSyncTarget } from "@/lib/sheet-sync";

describe("resolveSheetSyncTarget", () => {
  it("resolves every ported entry route to its tab and status fetcher", () => {
    for (const tab of PLAN_TABS) {
      if (!tab.paramPath) continue;
      const target = resolveSheetSyncTarget(tab.paramPath);
      expect(target?.tabKey).toBe(tab.key);
      expect(target?.destination).toBe(tab.paramPath);
      expect(typeof target?.getStatus).toBe("function");
    }
  });

  it("wires each destination to that plan type's endpoint", () => {
    expect(resolveSheetSyncTarget("/plans/saving/param")?.getStatus).toBe(
      getSavingPlanStatus,
    );
    expect(resolveSheetSyncTarget("/plans/ci/basicInfo")?.getStatus).toBe(
      getCiPlanStatus,
    );
  });

  it("rejects anything that isn't a known entry route", () => {
    // A missing / empty destination.
    expect(resolveSheetSyncTarget(null)).toBeUndefined();
    expect(resolveSheetSyncTarget(undefined)).toBeUndefined();
    expect(resolveSheetSyncTarget("")).toBeUndefined();
    // A real route, but not one this screen hands off to.
    expect(resolveSheetSyncTarget("/plans")).toBeUndefined();
    expect(resolveSheetSyncTarget("/plans/saving/sheet")).toBeUndefined();
    // Off-site: the allowlist is what stops the hand-off being an open redirect.
    expect(
      resolveSheetSyncTarget("https://evil.example/phish"),
    ).toBeUndefined();
    expect(resolveSheetSyncTarget("//evil.example")).toBeUndefined();
  });
});
