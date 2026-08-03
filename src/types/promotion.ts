/**
 * Promotion (優惠推廣) list types, shared via `@/types`. These map to the backend `/promotion`
 * list endpoint (`PromotionReadDto`). A promotion is one PDF flyer belonging to one insurance
 * company: no category axis and no free-text search, so the list takes a single optional
 * company filter.
 */

/**
 * Embedded company badge on a promotion row. The `/promotion` aggregation projects
 * `{ _id, realName, bg }` — the same shape `/handbook` returns, NOT the `name` shape the
 * `/insuranceCompany` filter list uses. The lookup is `$ifNull`-guarded server side, so it can
 * be missing on an orphaned promotion.
 */
export type PromotionCompanyDetail = {
  _id: string;
  realName: string; // badge label
  bg: string; // badge background color (CSS color)
};

/** One row in the promotions list response (`{ data: Promotion[] }`). */
export type Promotion = {
  _id: string;
  name: string; // promotion title
  path: string; // the promotion PDF url (handed to the Mini Program viewer)
  insuranceCompanyDetail: PromotionCompanyDetail | null;
};
