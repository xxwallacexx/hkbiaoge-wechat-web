/**
 * Saving-plan param/sheet types, shared via `@/types`. Ported from the mobile app's
 * `types/type.ts` (PlanDetail / PlanParam / Cal / PersonalInfo / BoosterRes). The web API
 * client takes no token (the axios interceptor injects the Bearer), so these are pure
 * data shapes; the Rust API serializes camelCase.
 */

/** Embedded insurance-company badge on a plan detail/status response. */
export type SavingPlanCompanyDetail = {
  _id: string;
  name: string;
  realName: string;
  bg: string; // badge background color (CSS color)
};

/** Present only once the plan is paid and unexpired. */
export type PlanPaymentDetail = {
  _id: string;
  completedAt: string;
  expiredAt: string;
};

/**
 * The backing worksheet. `isSynced` + `driveItemId` are written together by the webhook
 * once the OneDrive copy completes — both gate "the sheet is ready".
 */
export type PlanSheetDetail = {
  _id: string;
  isSynced: boolean;
  driveItemId?: string;
};

/** `GET /plan/{id}` and `GET /plan/{id}/status`. */
export type SavingPlanDetail = {
  _id: string;
  name: string;
  info: string;
  bg: string;
  price: number;
  paymentDetail?: PlanPaymentDetail;
  sheetDetail?: PlanSheetDetail;
  insuranceCompanyDetail: SavingPlanCompanyDetail;
  createdAt: string;
  updatedAt: string;
};

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
};

/** `PUT /sheet/{id}/cal` and `/calAdjust` result. */
export type SavingPlanCal = {
  instal: string;
  instal_num: number;
  amount: string;
};

/**
 * `updateSavingPlanSheetInfo` result — the cal plus the currency it was computed in (the
 * API doesn't echo currency, so the client re-attaches it, mirroring the mobile app).
 */
export type SavingPlanCalWithCurrency = SavingPlanCal & { currency: string };

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

/** `GET /plan/{id}/booster` — a suggested premium uplift. */
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

/** Props for the premium bottom-sheet card. Mirrors the mobile PlanPremiumCard. */
export type PlanPremiumCardProps = {
  expectedInstal: string;
  currency: string;
  amount: string;
  instal: string;
  isExpectedInstalError: boolean;
  isCalSubmitting: boolean;
  onExpectedInstalChange: (value: string) => void;
  isAdjustSubmitting: boolean;
  onAdjustSubmit: () => void;
  onGenerateSheetPress: () => void;
  isBoosterAvailable: boolean;
  isBoosterApplied: boolean;
  onBoosterPress: () => void;
  beforeBooster?: number;
  afterBooster?: number;
};
