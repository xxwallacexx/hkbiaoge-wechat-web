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
  UnitLinkedPlanSheetInfo,
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

// --- Sheet page (the generated worksheet) -----------------------------------

/** `GET /unitLinkedSheet/{id}/data` — the raw worksheet as a grid of strings (cols A–J). */
export function getUnitLinkedPlanSheetData(
  sheetId: string,
): Promise<string[][]> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/data`)
    .then((res) => res.data.data as string[][]);
}

/** `GET /unitLinkedSheet/{id}/cal` — the current installment/amount for the summary card. */
export function getUnitLinkedPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/cal`)
    .then((res) => res.data.data as PlanCal);
}

/** `GET /unitLinkedSheet/{id}/info` — period/currency/currentInterestRate for the summary. */
export function getUnitLinkedPlanSheetInfo(
  sheetId: string,
): Promise<UnitLinkedPlanSheetInfo> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/info`)
    .then((res) => res.data.data as UnitLinkedPlanSheetInfo);
}

/** `PUT /unitLinkedSheet/{id}/withdrawal` — set a withdrawal over rows [startRow, endRow]. */
export async function updateUnitLinkedPlanSheetWithdrawal({
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
  await api.put(`/unitLinkedSheet/${sheetId}/withdrawal`, {
    startRow,
    endRow,
    value,
  });
}

// --- Type-B-only sheet editors (health / area / custom parameters) ----------
// The backend 409s these for type A, so the screen only renders them (and thus only calls
// these) when the matching param cells / customParameters are present (type B).

/** `GET /unitLinkedSheet/{id}/area` — the current 地區 selection. */
export function getUnitLinkedPlanSheetArea(sheetId: string): Promise<string> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/area`)
    .then((res) => res.data.data as string);
}

/** `PUT /unitLinkedSheet/{id}/area` — a raw string body, so set application/json explicitly. */
export async function updateUnitLinkedPlanSheetArea({
  sheetId,
  value,
}: {
  sheetId: string;
  value: string;
}): Promise<void> {
  await api.put(`/unitLinkedSheet/${sheetId}/area`, value, {
    headers: { "Content-Type": "application/json" },
  });
}

/** `GET /unitLinkedSheet/{id}/health` — the current 健康標準 selection. */
export function getUnitLinkedPlanSheetHealth(sheetId: string): Promise<string> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/health`)
    .then((res) => res.data.data as string);
}

/** `PUT /unitLinkedSheet/{id}/health` — a raw string body, so set application/json explicitly. */
export async function updateUnitLinkedPlanSheetHealth({
  sheetId,
  value,
}: {
  sheetId: string;
  value: string;
}): Promise<void> {
  await api.put(`/unitLinkedSheet/${sheetId}/health`, value, {
    headers: { "Content-Type": "application/json" },
  });
}

/** `GET /unitLinkedSheet/{id}/customParameters` — per-parameter values (display strings). */
export function getUnitLinkedPlanSheetCustomParameters(
  sheetId: string,
): Promise<string[]> {
  return api
    .get(`/unitLinkedSheet/${sheetId}/customParameters`)
    .then((res) => res.data.data as string[]);
}

/** `PUT /unitLinkedSheet/{id}/customParameters` — the full values array (raw numbers). */
export async function updateUnitLinkedPlanSheetCustomParameters({
  sheetId,
  values,
}: {
  sheetId: string;
  values: number[];
}): Promise<void> {
  await api.put(`/unitLinkedSheet/${sheetId}/customParameters`, values);
}
