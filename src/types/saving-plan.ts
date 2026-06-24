/**
 * Saving-plan-specific types, shared via `@/types`. The cross-type shapes (PlanDetail,
 * PlanCal, payment/sheet, premium-card props) live in `./plan-detail`.
 */

/** `GET /plan/{id}/param` — drives the param form's selects. */
export type SavingPlanParam = {
  _id: string;
  planId: string;
  periodOptions: string[];
  currencyOptions: string[];
  premiumHeaders: string[];
  deathHeaders: string[];
  infoCell: string;
  infoRange: string;
  withdrawalCol: string;
  withdrawalLength: number;
  createdAt: string;
  updatedAt: string;
  // Sheet-page editing ranges (saving only). Present when the plan supports discount /
  // prepaid edits; the sheet page shows the matching trigger buttons only when set.
  discountRange?: string;
  prepaidCell?: string;
  prepaidOptions?: string[];
  prepaidRange?: string[];
};

/** A worksheet row keyed by its (Chinese) column header — the raw strings the API returns. */
export type PlanData = {
  [key: string]: string;
};

/** One year's withdrawal, derived from the sheet data for the withdrawal overview/chart. */
export type WithdrawalData = {
  year: string;
  age: string;
  withdrawal: number;
};

/**
 * `GET /sheet/{id}/personalInfo`. Only `period`/`currency` are used by the param screen
 * (to recompute the booster), but the full shape is kept for parity.
 */
export type SavingPlanPersonalInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
  period: number;
  currency: string;
  amount: number;
  instal: string;
};

/** `GET /plan/{id}/booster` — a suggested premium uplift (saving only). */
export type SavingPlanBooster = {
  beforeBooster: number;
  afterBooster: number;
};

/** Values collected by the saving-plan param form. */
export type SavingPlanParamFormValues = {
  name: string;
  age: number;
  sex: string;
  period: string;
  currency: string;
};

/** Props for the saving-plan param form. */
export type SavingPlanParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: SavingPlanParamFormValues) => void;
};
