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
    paramPath: "/plans/param",
  },
  { key: "dividend", endpoint: "/couponPlan", labelKey: "tabDividend" },
  { key: "ci", endpoint: "/ciPlan", labelKey: "tabCi" },
  { key: "life", endpoint: "/wholelifePlan", labelKey: "tabLife" },
  {
    key: "indexLinked",
    endpoint: "/unitLinkedPlan",
    labelKey: "tabIndexLinked",
  },
  { key: "annuity", endpoint: "/annuityPlan", labelKey: "tabAnnuity" },
] as const;

export const DEFAULT_TAB = PLAN_TABS[0];

/** Resolve a `?tab=` value to a tab, falling back to the default for unknown values. */
export function resolveTab(key: string | null | undefined): PlanTab {
  return PLAN_TABS.find((t) => t.key === key) ?? DEFAULT_TAB;
}
