/**
 * Destination resolution for the shared `/plans/sheetSync` gate screen.
 *
 * The screen is opened as `?planId=&destination=`, where `destination` is the entry route
 * of the plan type the user tapped. From that one value it needs three things: which
 * status endpoint to poll, which list cache to refresh once the worksheet lands, and where
 * to hand off. All three are derived from `PLAN_TABS`, so porting another plan type only
 * means adding its `paramPath` there plus a fetcher below.
 *
 * Resolving through that allowlist also keeps `destination` — which comes from the URL, so
 * it is user-controlled — from turning the hand-off into an open redirect: anything that
 * isn't a known `paramPath` resolves to `undefined` and the screen renders an error.
 */

import { getAnnuityPlanStatus } from "@/lib/api/annuity-plans";
import { getCiPlanStatus } from "@/lib/api/ci-plans";
import { getCouponPlanStatus } from "@/lib/api/coupon-plans";
import { getSavingPlanStatus } from "@/lib/api/saving-plans";
import { getUnitLinkedPlanStatus } from "@/lib/api/unit-linked-plans";
import { getWholelifePlanStatus } from "@/lib/api/wholelife-plans";
import { PLAN_TABS } from "@/lib/plans";
import type { PlanDetail, SheetSyncTarget } from "@/types";

/** `GET /{plan}/{id}/status`, keyed by `PlanTab.key`. */
const STATUS_FETCHERS: Record<string, (planId: string) => Promise<PlanDetail>> =
  {
    savings: getSavingPlanStatus,
    dividend: getCouponPlanStatus,
    ci: getCiPlanStatus,
    life: getWholelifePlanStatus,
    indexLinked: getUnitLinkedPlanStatus,
    annuity: getAnnuityPlanStatus,
  };

/**
 * Resolve a `?destination=` value to the plan type it belongs to, or `undefined` when it
 * isn't one of the ported entry routes.
 */
export function resolveSheetSyncTarget(
  destination: string | null | undefined,
): SheetSyncTarget | undefined {
  if (!destination) return undefined;
  const tab = PLAN_TABS.find((t) => t.paramPath === destination);
  if (!tab) return undefined;
  const getStatus = STATUS_FETCHERS[tab.key];
  if (!getStatus) return undefined;
  return { destination, tabKey: tab.key, getStatus };
}
