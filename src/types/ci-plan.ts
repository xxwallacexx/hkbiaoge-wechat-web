/**
 * CI-plan (critical-illness, the "ci" tab) types, shared via `@/types`. Cross-type shapes
 * (PlanDetail, PlanCal, payment/sheet) live in `./plan-detail` — CI reuses them. The CI
 * flow is two screens: basic-info (name/sex/age) → param (period/currency/health/area +
 * premium). No booster, no adjust.
 */

/** One CI period option: its value plus the maximum insurable age it allows. */
export type CiPlanPeriodOption = {
  value: string;
  maxAge: number;
};

/** One CI health option: its value plus the minimum insurable age it requires. */
export type CiPlanHealthOption = {
  value: string;
  minAge: number;
};

/** `GET /ciPlan/{id}/param` — drives the basic-info bounds + the param form's selects. */
export type CiPlanParam = {
  _id: string;
  ciPlanId: string;
  periodOptions: CiPlanPeriodOption[];
  currencyOptions: string[];
  healthOptions: CiPlanHealthOption[];
  areaOptions: string[];
  premiumHeaders: string[];
  deathHeaders: string[];
  withdrawalCol: string;
  minAge: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /ciSheet/{id}/basicInfo`. */
export type CiPlanSheetBasicInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
};

/** `GET /ciSheet/{id}/info` — period/health/area/currency for the sheet summary card. */
export type CiPlanSheetInfo = {
  period: string;
  health: string;
  area: string;
  currency: string;
};

/** Values collected by the CI basic-info form (step 1). */
export type CiPlanBasicInfoFormValues = {
  name: string;
  age: number;
  sex: string;
};

/** Props for the CI basic-info form. */
export type CiPlanBasicInfoFormProps = {
  minAge: number;
  maxAge: number;
  isSubmitting: boolean;
  onSubmit: (values: CiPlanBasicInfoFormValues) => void;
};

/** Values collected by the CI param form (step 2). */
export type CiPlanParamFormValues = {
  period: string;
  currency: string;
  health: string;
  area: string;
};

/**
 * Props for the CI param form. `periodOptions`/`healthOptions` are pre-filtered to the
 * entered age before being passed in.
 */
export type CiPlanParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  healthOptions: string[];
  areaOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: CiPlanParamFormValues) => void;
};
