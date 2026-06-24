/**
 * Coupon-plan API calls (the "dividend" tab). Same conventions as `saving-plans.ts`:
 * NO token arg (the axios interceptor injects the Bearer), errors reject (no swallow),
 * responses unwrap `res.data.data`, and multi-arg functions take a single object. Coupon
 * has no booster. The flow spans `/couponPlan/*` (reads) and `/couponSheet/*` (writes).
 */

import { api } from "@/lib/api/client";
import type {
  CouponPlanParam,
  CouponPlanSheetBasicInfo,
  CouponPlanSheetInfo,
  PlanCal,
  PlanCalWithCurrency,
  PlanDetail,
} from "@/types";

export function getCouponPlanDetail(planId: string): Promise<PlanDetail> {
  return api
    .get(`/couponPlan/${planId}`)
    .then((res) => res.data.data as PlanDetail);
}

export function getCouponPlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/couponPlan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getCouponPlanParam(planId: string): Promise<CouponPlanParam> {
  return api
    .get(`/couponPlan/${planId}/param`)
    .then((res) => res.data.data as CouponPlanParam);
}

export function getCouponPlanSheetBasicInfo(
  sheetId: string,
): Promise<CouponPlanSheetBasicInfo> {
  return api
    .get(`/couponSheet/${sheetId}/basicInfo`)
    .then((res) => res.data.data as CouponPlanSheetBasicInfo);
}

export function updateCouponPlanSheetBasicInfo({
  sheetId,
  name,
  sex,
  age,
}: {
  sheetId: string;
  name: string;
  sex: string;
  age: number;
}): Promise<void> {
  // Step 1: persist name/sex/age, then the screen navigates to the param step.
  return api
    .put(`/couponSheet/${sheetId}/basicInfo`, { name, sex, age })
    .then(() => undefined);
}

export async function updateCouponPlanSheetInfo({
  sheetId,
  period,
  currency,
  dividend,
}: {
  sheetId: string;
  period: string;
  currency: string;
  dividend: string;
}): Promise<PlanCalWithCurrency> {
  const res = await api.put(`/couponSheet/${sheetId}/info`, {
    period,
    currency,
    dividend,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as PlanCal), currency };
}

export function updateCouponPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // Axum `Json<i32>`: the body is the raw number but must be application/json (axios
  // won't set that for a primitive body), else the API returns 415.
  return api
    .put(`/couponSheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}

export function adjustCouponPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .put(`/couponSheet/${sheetId}/calAdjust`)
    .then((res) => res.data.data as PlanCal);
}

// --- Sheet page (the generated worksheet) -----------------------------------

/** `GET /couponSheet/{id}/data` — the raw worksheet as a grid of strings. */
export function getCouponPlanSheetData(sheetId: string): Promise<string[][]> {
  return api
    .get(`/couponSheet/${sheetId}/data`)
    .then((res) => res.data.data as string[][]);
}

/** `GET /couponSheet/{id}/cal` — the current installment/amount for the summary card. */
export function getCouponPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .get(`/couponSheet/${sheetId}/cal`)
    .then((res) => res.data.data as PlanCal);
}

/** `GET /couponSheet/{id}/info` — period/currency/dividend for the summary card. */
export function getCouponPlanSheetInfo(
  sheetId: string,
): Promise<CouponPlanSheetInfo> {
  return api
    .get(`/couponSheet/${sheetId}/info`)
    .then((res) => res.data.data as CouponPlanSheetInfo);
}

/** `PUT /couponSheet/{id}/withdrawal` — set a withdrawal over rows [startRow, endRow]. */
export async function updateCouponPlanSheetWithdrawal({
  sheetId,
  startRow,
  endRow,
  value,
}: {
  sheetId: string;
  startRow: number;
  endRow: number;
  value: number;
}): Promise<void> {
  await api.put(`/couponSheet/${sheetId}/withdrawal`, {
    startRow,
    endRow,
    value,
  });
}
