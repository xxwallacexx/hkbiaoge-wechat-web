/**
 * Whole-life-plan (the "life" tab) types, shared via `@/types`. Cross-type shapes
 * (PlanDetail, PlanCal, payment/sheet) live in `./plan-detail` — whole-life reuses them. The
 * flow is two screens: basic-info (name/sex/age) → param (period/currency/health/area +
 * premium). No booster, no adjust.
 */

/** One whole-life period option: its value plus the maximum insurable age it allows. */
export type WholelifePlanPeriodOption = {
  value: string;
  maxAge: number;
};

/** One whole-life health option: its value plus the minimum insurable age it requires. */
export type WholelifePlanHealthOption = {
  value: string;
  minAge: number;
};

/** `GET /wholelifePlan/{id}/param` — drives the basic-info bounds + the param form's selects. */
export type WholelifePlanParam = {
  _id: string;
  wholelifePlanId: string;
  periodOptions: WholelifePlanPeriodOption[];
  currencyOptions: string[];
  healthOptions: WholelifePlanHealthOption[];
  areaOptions: string[];
  premiumHeaders: string[];
  deathHeaders: string[];
  withdrawalCol: string;
  minAge: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /wholelifeSheet/{id}/basicInfo`. */
export type WholelifePlanSheetBasicInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
};

/** `GET /wholelifeSheet/{id}/info` — period/health/area/currency for the sheet summary card. */
export type WholelifePlanSheetInfo = {
  period: string;
  health: string;
  area: string;
  currency: string;
};

/** Values collected by the whole-life basic-info form (step 1). */
export type WholelifePlanBasicInfoFormValues = {
  name: string;
  age: number;
  sex: string;
};

/** Props for the whole-life basic-info form. */
export type WholelifePlanBasicInfoFormProps = {
  minAge: number;
  maxAge: number;
  isSubmitting: boolean;
  onSubmit: (values: WholelifePlanBasicInfoFormValues) => void;
};

/** Values collected by the whole-life param form (step 2). */
export type WholelifePlanParamFormValues = {
  period: string;
  currency: string;
  health: string;
  area: string;
};

/**
 * Props for the whole-life param form. `periodOptions`/`healthOptions` are pre-filtered to
 * the entered age before being passed in.
 */
export type WholelifePlanParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  healthOptions: string[];
  areaOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: WholelifePlanParamFormValues) => void;
};
