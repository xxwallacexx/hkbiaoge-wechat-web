/**
 * Brochure (handbook) list types, shared via `@/types`. The runtime config (BROCHURE_TABS,
 * PAGE_SIZE, …) lives in `@/lib/brochures`. These map to the backend `/handbook` list endpoint
 * (`HandbookReadDto`); "brochure" is the route-facing name (產品單頁) for a handbook.
 */

/**
 * Embedded company badge on a brochure row. NOTE: the `/handbook` endpoint returns `realName`
 * (not `name` like the `/insuranceCompany` filter list does), so this is a distinct shape from
 * the shared `InsuranceCompanyDetail`.
 */
export type BrochureCompanyDetail = {
  _id: string;
  realName: string; // badge label
  bg: string; // badge background color (CSS color)
};

/** One row in the brochures list response (`{ data: Brochure[] }`). */
export type Brochure = {
  _id: string;
  name: string; // brochure title
  path: string; // the brochure PDF path / url (passed to the detail screen)
  handbookType: string; // SAVING | CI | LIVING | WHOLELIFE | MEDICAL | RETIREMENT
  insuranceCompanyDetail: BrochureCompanyDetail;
};

/**
 * One brochure category tab. Unlike plans (one endpoint per category), all brochure categories
 * share the `/handbook` endpoint and select the category via the `handbookType` query param —
 * so `key` doubles as the URL `?tab=` value and the `handbookType` filter.
 */
export type BrochureTab = {
  key: string;
  labelKey: string; // i18n key under the `Brochures` namespace
};

/** Arguments for `useBrochuresQuery`. */
export type BrochuresQueryParams = {
  tab: BrochureTab;
  search: string;
  companyId?: string;
};
