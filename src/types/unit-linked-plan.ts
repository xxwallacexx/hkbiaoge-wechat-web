/**
 * Unit-linked-plan (the "indexLinked" tab) types, shared via `@/types`. Cross-type shapes
 * (PlanDetail, PlanCal, payment/sheet) live in `./plan-detail`. Two screens: basic-info
 * (name/sex/age) → param (period/currency/currentInterestRate + premium). NO booster, NO
 * adjust. The premium flow branches on `planType`: "A" = a single cal sheet (like CI);
 * "B" = enter amount → premium range → a 2nd sheet to pick an installment within the range.
 */

/** One unit-linked period option: its value plus the maximum insurable age it allows. */
export type UnitLinkedPlanPeriodOption = {
  value: string;
  maxAge: number;
};

/** `GET /unitLinkedPlan/{id}/param` — drives the basic-info bounds + the param form's selects. */
export type UnitLinkedPlanParam = {
  _id: string;
  unitLinkedPlanId: string;
  periodOptions: UnitLinkedPlanPeriodOption[];
  currencyOptions: string[];
  currentInterestRateOptions: string[];
  minAge: number;
  /** "A" → single cal sheet; "B" → amount → range → installment sheet. */
  planType: "A" | "B";
  createdAt: string;
  updatedAt: string;
};

/** `PUT /unitLinkedSheet/{id}/amount` result (type B): the premium range for an amount. */
export type UnitLinkedEstimatedInstal = {
  estimatedInstal: number;
  maxInstal: number;
  amount: string;
};

/** `GET /unitLinkedSheet/{id}/basicInfo`. */
export type UnitLinkedPlanSheetBasicInfo = {
  name: string;
  sex: "男" | "女";
  age: number;
};

/** Values collected by the unit-linked basic-info form (step 1). */
export type UnitLinkedPlanBasicInfoFormValues = {
  name: string;
  age: number;
  sex: string;
};

/** Props for the unit-linked basic-info form. */
export type UnitLinkedPlanBasicInfoFormProps = {
  minAge: number;
  maxAge: number;
  isSubmitting: boolean;
  onSubmit: (values: UnitLinkedPlanBasicInfoFormValues) => void;
};

/** Values collected by the unit-linked param form (step 2). */
export type UnitLinkedPlanParamFormValues = {
  period: string;
  currency: string;
  currentInterestRate: string;
};

/** Props for the unit-linked param form. `periodOptions` is pre-filtered to the entered age. */
export type UnitLinkedPlanParamFormProps = {
  periodOptions: string[];
  currencyOptions: string[];
  currentInterestRateOptions: string[];
  isSubmitting: boolean;
  onSubmit: (values: UnitLinkedPlanParamFormValues) => void;
};

/** Props for the type-B "enter amount → premium range → Next" bottom-sheet card. */
export type UnitLinkedPlanBAmountCardProps = {
  expectedAmount: string;
  currency: string;
  amount: string;
  isAmountSubmitting: boolean;
  onExpectedAmountChange: (value: string) => void;
  onNextButtonPress: () => void;
  estimatedInstal?: number;
  maxInstal?: number;
};

/** Props for the type-B "pick an installment within the range" bottom-sheet card. */
export type UnitLinkedPlanBInstalCardProps = {
  currency: string;
  minInstal: number;
  maxInstal: number;
  isSubmitting: boolean;
  onSubmit: (value: number) => void;
};
