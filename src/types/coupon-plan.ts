/**
 * Coupon-plan-specific types (the "dividend" tab), shared via `@/types`. Cross-type
 * shapes (PlanDetail, PlanCal, payment/sheet) live in `./plan-detail` — coupon reuses
 * them. The coupon flow is two screens: basic-info (name/sex/age) → param
 * (period/currency/dividend + premium). No booster.
 */

/** One coupon period option: its value plus the maximum insurable age it allows. */
export type CouponPlanPeriodOption = {
  value: string;
  maxAge: number;
};

/** `GET /couponPlan/{id}/param` — drives the basic-info bounds + the param form's selects. */
export type CouponPlanParam = {
  _id: string;
  couponPlanId: string;
  periodOptions: CouponPlanPeriodOption[];
  currencyOptions: string[];
  dividendOptions: string[];
  premiumHeaders: string[];
  deathHeaders: string[];
  withdrawalCol: string;
  minAge: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /couponSheet/{id}/basicInfo`. */
export type CouponPlanSheetBasicInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
};

/** Values collected by the coupon basic-info form (step 1). */
export type CouponPlanBasicInfoFormValues = {
  name: string;
  age: number;
  sex: string;
};

/** Props for the coupon basic-info form. */
export type CouponPlanBasicInfoFormProps = {
  minAge: number;
  maxAge: number;
  isSubmitting: boolean;
  onSubmit: (values: CouponPlanBasicInfoFormValues) => void;
};

/** Values collected by the coupon param form (step 2). */
export type CouponPlanParamFormValues = {
  period: string;
  currency: string;
  dividend: string;
};

/** Props for the coupon param form. `periodOptions` is pre-filtered to the entered age. */
export type CouponPlanParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  dividendOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: CouponPlanParamFormValues) => void;
};
