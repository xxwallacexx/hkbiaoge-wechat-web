/**
 * Unit-linked-plan (the "indexLinked" tab) API calls. Same conventions as `ci-plans.ts`: NO
 * token arg (the axios interceptor injects the Bearer), errors reject (no swallow), responses
 * unwrap `res.data.data`, and multi-arg functions take a single object. No booster, no adjust.
 * Reads under `/unitLinkedPlan/*`, writes under `/unitLinkedSheet/*`. The premium write
 * branches on the plan's `planType`: "A" uses `/cal`; "B" uses `/amount` then `/install`.
 */

import { api } from "@/lib/api/client";
import type {
  PlanCal,
  PlanCalWithCurrency,
  PlanDetail,
  UnitLinkedEstimatedInstal,
  UnitLinkedPlanParam,
  UnitLinkedPlanSheetBasicInfo,
} from "@/types";

export function getUnitLinkedPlanDetail(planId: string): Promise<PlanDetail> {
  return api
    .get(`/unitLinkedPlan/${planId}`)
    .then((res) => res.data.data as PlanDetail);
}

export function getUnitLinkedPlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/unitLinkedPlan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getUnitLinkedPlanParam(
  planId: string,
): Promise<UnitLinkedPlanParam> {
  return api
    .get(`/unitLinkedPlan/${planId}/param`)
    .then((res) => res.data.data as UnitLinkedPlanParam);
}

export function getUnitLinkedPlanSheetBasicInfo(
  sheetId: string,
): Promise<UnitLinkedPlanSheetBasicInfo> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/basicInfo`)
    .then((res) => res.data.data as UnitLinkedPlanSheetBasicInfo);
}

export function updateUnitLinkedPlanSheetBasicInfo({
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
    .put(`/unitLinkedSheet/${sheetId}/basicInfo`, { name, sex, age })
    .then(() => undefined);
}

export async function updateUnitLinkedPlanSheetInfo({
  sheetId,
  period,
  currentInterestRate,
  currency,
}: {
  sheetId: string;
  period: string;
  currentInterestRate: string;
  currency: string;
}): Promise<PlanCalWithCurrency> {
  const res = await api.put(`/unitLinkedSheet/${sheetId}/info`, {
    period,
    currentInterestRate,
    currency,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as PlanCal), currency };
}

export function updateUnitLinkedPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // Type A. Axum `Json<i32>`: the body is the raw number but must be application/json (axios
  // won't set that for a primitive body), else the API returns 415.
  return api
    .put(`/unitLinkedSheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}

export function updateUnitLinkedPlanSheetAmount({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<UnitLinkedEstimatedInstal> {
  // Type B step 1: an insured amount → an estimated premium range. Bare-number Json<i32>.
  return api
    .put(`/unitLinkedSheet/${sheetId}/amount`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as UnitLinkedEstimatedInstal);
}

export function updateUnitLinkedPlanSheetInstall({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<void> {
  // Type B step 2: the chosen installment within the range. Bare-number Json<i32>.
  return api
    .put(`/unitLinkedSheet/${sheetId}/install`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then(() => undefined);
}
