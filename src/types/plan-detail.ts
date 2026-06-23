/**
 * Plan detail / status / cal shapes shared across plan types (saving, coupon, …), via
 * `@/types`. The Rust API returns these for every plan type; per-type modules
 * (`saving-plan.ts`, `coupon-plan.ts`) add only their type-specific shapes.
 */

/** Embedded insurance-company badge on a plan detail/status response. */
export type PlanCompanyDetail = {
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

/** `GET /{plan}/{id}` and `GET /{plan}/{id}/status` (saving: `/plan`, coupon: `/couponPlan`). */
export type PlanDetail = {
  _id: string;
  name: string;
  info: string;
  bg: string;
  price: number;
  paymentDetail?: PlanPaymentDetail | null;
  sheetDetail?: PlanSheetDetail | null;
  insuranceCompanyDetail: PlanCompanyDetail;
  createdAt: string;
  updatedAt: string;
};

/** `PUT /{sheet}/{id}/cal` and `/calAdjust` (and `/info`) result. */
export type PlanCal = {
  instal: string;
  instal_num: number;
  amount: string;
};

/**
 * A cal plus the currency it was computed in — the `info` endpoints don't echo currency,
 * so the client re-attaches it (mirrors the mobile app).
 */
export type PlanCalWithCurrency = PlanCal & { currency: string };

/**
 * Props for the shared premium bottom-sheet card. Booster + adjust fields are optional:
 * saving passes booster, coupon/CI omit it; saving + coupon pass adjust, CI omits it (no
 * adjust). The card hides whatever isn't provided.
 */
export type PlanPremiumCardProps = {
  expectedInstal: string;
  currency: string;
  amount: string;
  instal: string;
  isCalSubmitting: boolean;
  onExpectedInstalChange: (value: string) => void;
  onGenerateSheetPress: () => void;
  isExpectedInstalError?: boolean;
  isAdjustSubmitting?: boolean;
  onAdjustSubmit?: () => void;
  isBoosterAvailable?: boolean;
  isBoosterApplied?: boolean;
  onBoosterPress?: () => void;
  beforeBooster?: number;
  afterBooster?: number;
};
