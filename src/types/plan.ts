/**
 * Insurance-plan & products-list types, shared via `@/types`. The runtime config
 * (PLAN_TABS, PAGE_SIZE, …) lives in `@/lib/plans`.
 */

import type {
  PlanDetail,
  PlanPaymentDetail,
  PlanSheetDetail,
} from "./plan-detail";

/** Embedded company badge on a plan row / in the filter list. */
export type InsuranceCompanyDetail = {
  _id: string;
  name: string; // badge label, e.g. 友記 / 保記
  realName: string;
  bg: string; // badge background color (CSS color)
};

/** One row in the plans list response (`{ data: PlanOverview[] }`). */
export type PlanOverview = {
  _id: string;
  name: string; // plan title
  info: string; // grey subtitle / detail line
  bg: string;
  insuranceCompanyDetail: InsuranceCompanyDetail;
  // The list endpoint also returns the signed-in user's payment + worksheet status per
  // plan (null until they exist), used to gate the row tap: pay → sync → param.
  paymentDetail?: PlanPaymentDetail | null;
  sheetDetail?: PlanSheetDetail | null;
};

/** One category tab (the API exposes one endpoint per category). */
export type PlanTab = {
  key: string; // URL `?tab=` value
  endpoint: string; // API path (relative to the `/api` baseURL)
  labelKey: string; // i18n key under the `Plans` namespace
  paramPath?: string; // route opened on row tap; only set for ported plan types
};

/**
 * A `?destination=` value the sheet-sync gate screen accepts, resolved against the ported
 * plan tabs: where to hand off once the worksheet is ready, whose list cache that
 * invalidates, and how to poll this plan type's status. See `@/lib/sheet-sync`.
 */
export type SheetSyncTarget = {
  destination: string; // the tab's `paramPath`
  tabKey: string; // `PlanTab.key`, i.e. the `["plans", key, …]` query cache
  getStatus: (planId: string) => Promise<PlanDetail>;
};

/** Arguments for `usePlansQuery`. */
export type PlansQueryParams = {
  tab: PlanTab;
  search: string;
  companyId?: string;
};

/** Props for the company-filter bottom sheet. */
export type CompanyFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
};
