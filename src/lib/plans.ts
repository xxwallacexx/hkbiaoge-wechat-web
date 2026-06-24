/**
 * Insurance-plan list runtime config, shared by the `/plans` page. The types live in
 * `@/types` (see types/plan.ts).
 */

import type { PlanTab } from "@/types";

export const PAGE_SIZE = 20;

export const PLAN_TABS: readonly PlanTab[] = [
  {
    key: "savings",
    endpoint: "/plan",
    labelKey: "tabSavings",
    paramPath: "/plans/saving/param",
  },
  {
    key: "dividend",
    endpoint: "/couponPlan",
    labelKey: "tabDividend",
    paramPath: "/plans/coupon/basicInfo",
  },
  {
    key: "ci",
    endpoint: "/ciPlan",
    labelKey: "tabCi",
    paramPath: "/plans/ci/basicInfo",
  },
  {
    key: "life",
    endpoint: "/wholelifePlan",
    labelKey: "tabLife",
    paramPath: "/plans/wholelife/basicInfo",
  },
  {
    key: "indexLinked",
    endpoint: "/unitLinkedPlan",
    labelKey: "tabIndexLinked",
    paramPath: "/plans/unitLinked/basicInfo",
  },
  { key: "annuity", endpoint: "/annuityPlan", labelKey: "tabAnnuity" },
] as const;

export const DEFAULT_TAB = PLAN_TABS[0];

/** Resolve a `?tab=` value to a tab, falling back to the default for unknown values. */
export function resolveTab(key: string | null | undefined): PlanTab {
  return PLAN_TABS.find((t) => t.key === key) ?? DEFAULT_TAB;
}
