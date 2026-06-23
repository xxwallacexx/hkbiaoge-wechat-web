/**
 * Insurance-plan & products-list types, shared via `@/types`. The runtime config
 * (PLAN_TABS, PAGE_SIZE, …) lives in `@/lib/plans`.
 */

/** Embedded company badge on a plan row / in the filter list. */
export type InsuranceCompanyDetail = {
  _id: string;
  name: string; // badge label, e.g. 友記 / 保記
  bg: string; // badge background color (CSS color)
};

/** One row in the plans list response (`{ data: PlanOverview[] }`). */
export type PlanOverview = {
  _id: string;
  name: string; // plan title
  info: string; // grey subtitle / detail line
  bg: string;
  insuranceCompanyDetail: InsuranceCompanyDetail;
};

/** One category tab (the API exposes one endpoint per category). */
export type PlanTab = {
  key: string; // URL `?tab=` value
  endpoint: string; // API path (relative to the `/api` baseURL)
  labelKey: string; // i18n key under the `Plans` namespace
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
