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
