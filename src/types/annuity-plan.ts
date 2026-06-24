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

/** One annuity-age option for the annuity-info form's select (when not free-input). */
export type AnnuityAgeOption = {
  value: number;
  period: string;
  minAge: number;
  maxAge: number;
};

/** Bounds for the annuity-info form's age input (shared by single + couple annuity). */
export type AnnuityConstraint = {
  minAge: number;
  maxAge: number;
  minPeriod?: number;
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
  // Sheet-page fields (the API returns these on the param read). The annuity sheet branches on
  // `annuityPlanType`: GENERAL renders a single table keyed by `headers`; DEFERED renders the
  // premium/death two-tab split keyed by `premiumHeaders`/`deathHeaders` (the same column shape
  // as coupon). The annuity-info editor reads `annuityAgeOptions` / `annuityConstraint` /
  // `annuityTypeOptions` (+ `isAnnuityAgeFreeInput`); couple-annuity uses
  // `coupleAnnuityTypeOptions`; the payout-period editor is gated on `payoutPeriodOptions` being
  // non-empty. Headers are `Option` server-side (only the matching plan type carries each set).
  headers?: string[];
  premiumHeaders?: string[];
  deathHeaders?: string[];
  withdrawalCol: string;
  isAnnuityAgeFreeInput: boolean;
  annuityAgeOptions: AnnuityAgeOption[];
  annuityConstraint: AnnuityConstraint;
  annuityTypeOptions: string[];
  coupleAnnuityTypeOptions?: string[];
  payoutPeriodOptions?: string[];
  createdAt: string;
  updatedAt: string;
};

/** `GET /annuitySheet/{id}/info` — period (+ GENERAL-only amount) + currency for the summary. */
export type AnnuitySheetInfo = {
  period: string;
  /** GENERAL only: the user-entered investment amount (absent for defered/immediate). */
  amount?: string;
  currency: string;
};

/** `GET|PUT /annuitySheet/{id}/annuityInfo` — the single-life annuity selection. */
export type AnnuityInfo = {
  annuityOption: string;
  annuityAge: number;
};

/** `GET|PUT /annuitySheet/{id}/coupleAnnuityInfo` — the joint/spouse annuity selection. */
export type CoupleAnnuityInfo = {
  coupleAnnuityAge: number;
  coupleAnnuityOption: string;
};

/** One row of `GET /annuitySheet/{id}/{couple,}annuityReceivable` — a named, formatted payout. */
export type AnnuityReceivable = {
  name: string;
  value: string;
};

/** `GET /annuitySheet/{id}` (root) — the sheet doc's annuity/couple display-type flags. */
export type AnnuitySheet = {
  isAnnuityEnabled: boolean;
  isCoupleAnnuityEnabled: boolean;
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
