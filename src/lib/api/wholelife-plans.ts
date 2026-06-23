/**
 * Whole-life-plan (the "life" tab) API calls. Same conventions as `ci-plans.ts`: NO token
 * arg (the axios interceptor injects the Bearer), errors reject (no swallow), responses
 * unwrap `res.data.data`, and multi-arg functions take a single object. Whole-life has no
 * booster and no adjust. Reads under `/wholelifePlan/*`, writes under `/wholelifeSheet/*`.
 */

import { api } from "@/lib/api/client";
import type {
  PlanCal,
  PlanCalWithCurrency,
  PlanDetail,
  WholelifePlanParam,
  WholelifePlanSheetBasicInfo,
} from "@/types";

export function getWholelifePlanDetail(planId: string): Promise<PlanDetail> {
  return api
    .get(`/wholelifePlan/${planId}`)
    .then((res) => res.data.data as PlanDetail);
}

export function getWholelifePlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/wholelifePlan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getWholelifePlanParam(
  planId: string,
): Promise<WholelifePlanParam> {
  return api
    .get(`/wholelifePlan/${planId}/param`)
    .then((res) => res.data.data as WholelifePlanParam);
}

export function getWholelifePlanSheetBasicInfo(
  sheetId: string,
): Promise<WholelifePlanSheetBasicInfo> {
  return api
    .get(`/wholelifeSheet/${sheetId}/basicInfo`)
    .then((res) => res.data.data as WholelifePlanSheetBasicInfo);
}

export function updateWholelifePlanSheetBasicInfo({
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
    .put(`/wholelifeSheet/${sheetId}/basicInfo`, { name, sex, age })
    .then(() => undefined);
}

export async function updateWholelifePlanSheetInfo({
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
  const res = await api.put(`/wholelifeSheet/${sheetId}/info`, {
    period,
    health,
    area,
    currency,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as PlanCal), currency };
}

export function updateWholelifePlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // Axum `Json<i32>`: the body is the raw number but must be application/json (axios won't
  // set that for a primitive body), else the API returns 415.
  return api
    .put(`/wholelifeSheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}
