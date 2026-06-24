/**
 * Annuity-plan (the "annuity" tab) types, shared via `@/types`. Cross-type shapes
 * (PlanDetail, PlanCal, payment/sheet) live in `./plan-detail`. Two screens: basic-info
 * (name/sex/age) → param. The param step branches on `annuityPlanType`:
 *   GENERAL → period (free-numeric, constrained) + currency + amount; submit goes straight
 *     to the sheet (no premium bottom-sheet — the `amount` is the user's input).
 *   DEFERED / IMMEDIATE → period (select) + currency; submit opens the premium sheet with a
 *     debounced cal + adjust. No booster.
 */

/** Which annuity variant — selects the param form and the premium flow. */
export type AnnuityPlanType = "GENERAL" | "DEFERED" | "IMMEDIATE";

/** Constraint on the GENERAL form's free-numeric period: an allow-list and/or a min..max range. */
export type AnnuityPeriodConstraint = {
  oneOf: number[];
  min: number;
  max: number;
};

/** One non-GENERAL period option: its value plus the maximum insurable age it allows. */
export type AnnuityPlanPeriodOption = {
  value: string;
  maxAge: number;
};

/** `GET /annuityPlan/{id}/param` — its `annuityPlanType` drives the param form + premium flow. */
export type AnnuityPlanParam = {
  _id: string;
  annuityPlanType: AnnuityPlanType;
  /** GENERAL only: constrains the free-numeric period input. */
  periodConstraint?: AnnuityPeriodConstraint;
  /** Non-GENERAL only: the period select's options (filtered to the entered age in the hook). */
  periodOptions?: AnnuityPlanPeriodOption[];
  currencyOptions: string[];
  minAge: number;
  maxAge: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /annuitySheet/{id}/basicInfo`. */
export type AnnuityPlanSheetBasicInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
};

/** Values collected by the annuity basic-info form (step 1). */
export type AnnuityPlanBasicInfoFormValues = {
  name: string;
  age: number;
  sex: string;
};

/** Props for the annuity basic-info form. */
export type AnnuityPlanBasicInfoFormProps = {
  minAge: number;
  maxAge: number;
  isSubmitting: boolean;
  onSubmit: (values: AnnuityPlanBasicInfoFormValues) => void;
};

/** Values from the GENERAL annuity param form (free-numeric period + currency + amount). */
export type AnnuityGeneralParamFormValues = {
  period: string;
  currency: string;
  amount: string;
};

/** Props for the GENERAL annuity param form. */
export type AnnuityGeneralParamFormProps = {
  periodConstraint?: AnnuityPeriodConstraint;
  currencyOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: AnnuityGeneralParamFormValues) => void;
};

/** Values from the non-GENERAL (defered/immediate) annuity param form. */
export type AnnuityDeferedParamFormValues = {
  period: string;
  currency: string;
};

/** Props for the non-GENERAL annuity param form. `periodOptions` is pre-filtered to the entered age. */
export type AnnuityDeferedParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: AnnuityDeferedParamFormValues) => void;
};
