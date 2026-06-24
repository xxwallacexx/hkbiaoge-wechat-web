/**
 * CI-plan (critical illness, the "ci" tab) API calls. Same conventions as `coupon-plans.ts`:
 * NO token arg (the axios interceptor injects the Bearer), errors reject (no swallow),
 * responses unwrap `res.data.data`, and multi-arg functions take a single object. CI has no
 * booster and no adjust. Reads under `/ciPlan/*`, writes under `/ciSheet/*`.
 */

import { api } from "@/lib/api/client";
import type {
  CiPlanParam,
  CiPlanSheetBasicInfo,
  CiPlanSheetInfo,
  PlanCal,
  PlanCalWithCurrency,
  PlanDetail,
} from "@/types";

export function getCiPlanDetail(planId: string): Promise<PlanDetail> {
  return api
    .get(`/ciPlan/${planId}`)
    .then((res) => res.data.data as PlanDetail);
}

export function getCiPlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/ciPlan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getCiPlanParam(planId: string): Promise<CiPlanParam> {
  return api
    .get(`/ciPlan/${planId}/param`)
    .then((res) => res.data.data as CiPlanParam);
}

export function getCiPlanSheetBasicInfo(
  sheetId: string,
): Promise<CiPlanSheetBasicInfo> {
  return api
    .get(`/ciSheet/${sheetId}/basicInfo`)
    .then((res) => res.data.data as CiPlanSheetBasicInfo);
}

export function updateCiPlanSheetBasicInfo({
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
    .put(`/ciSheet/${sheetId}/basicInfo`, { name, sex, age })
    .then(() => undefined);
}

export async function updateCiPlanSheetInfo({
  sheetId,
  period,
  health,
  area,
  currency,
}: {
  sheetId: string;
  period: string;
  health: string;
  area: string;
  currency: string;
}): Promise<PlanCalWithCurrency> {
  const res = await api.put(`/ciSheet/${sheetId}/info`, {
    period,
    health,
    area,
    currency,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as PlanCal), currency };
}

export function updateCiPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // Axum `Json<i32>`: the body is the raw number but must be application/json (axios won't
  // set that for a primitive body), else the API returns 415.
  return api
    .put(`/ciSheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}

// --- Sheet page (the generated worksheet) -----------------------------------
// CI has no withdrawal / discount / prepaid editor (no such backend routes), so the sheet
// page only needs these read getters.

/** `GET /ciSheet/{id}/data` — the raw worksheet as a grid of strings. */
export function getCiPlanSheetData(sheetId: string): Promise<string[][]> {
  return api
    .get(`/ciSheet/${sheetId}/data`)
    .then((res) => res.data.data as string[][]);
}

/** `GET /ciSheet/{id}/cal` — the current installment/amount for the summary card. */
export function getCiPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .get(`/ciSheet/${sheetId}/cal`)
    .then((res) => res.data.data as PlanCal);
}

/** `GET /ciSheet/{id}/info` — period/health/area/currency for the summary card. */
export function getCiPlanSheetInfo(sheetId: string): Promise<CiPlanSheetInfo> {
  return api
    .get(`/ciSheet/${sheetId}/info`)
    .then((res) => res.data.data as CiPlanSheetInfo);
}
