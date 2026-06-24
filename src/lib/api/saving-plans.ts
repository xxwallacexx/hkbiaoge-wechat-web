/**
 * Saving-plan API calls + the param screen's booster predicate.
 *
 * Unlike the mobile app these take NO token (the axios interceptor in `lib/api/client.ts`
 * attaches the Bearer from the `wv_token` cookie) and they do NOT swallow errors —
 * failures reject so react-query's `onError` can surface a toast. Responses use the API's
 * `{ data }` envelope, so everything unwraps `res.data.data`. Functions with several (or
 * same-typed) args take a single object so call sites are order-independent.
 */

import { api } from "@/lib/api/client";
import type {
  PlanCal,
  PlanCalWithCurrency,
  PlanDetail,
  SavingPlanBooster,
  SavingPlanParam,
  SavingPlanPersonalInfo,
} from "@/types";

// Shared premium guard, re-exported so saving call sites can import from one place.
export {
  isExpectedInstalTooLarge,
  MAX_EXPECTED_INSTAL,
} from "@/lib/plan-premium";

export function getSavingPlanDetail(planId: string): Promise<PlanDetail> {
  return api.get(`/plan/${planId}`).then((res) => res.data.data as PlanDetail);
}

export function getSavingPlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/plan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getSavingPlanParam(planId: string): Promise<SavingPlanParam> {
  return api
    .get(`/plan/${planId}/param`)
    .then((res) => res.data.data as SavingPlanParam);
}

export function getSavingPlanBooster({
  planId,
  period,
  currency,
  instal,
}: {
  planId: string;
  period: string;
  currency: string;
  instal: number;
}): Promise<SavingPlanBooster> {
  return api
    .get(`/plan/${planId}/booster`, { params: { period, currency, instal } })
    .then((res) => res.data.data as SavingPlanBooster);
}

export function getSavingPlanSheetPersonalInfo(
  sheetId: string,
): Promise<SavingPlanPersonalInfo> {
  return api
    .get(`/sheet/${sheetId}/personalInfo`)
    .then((res) => res.data.data as SavingPlanPersonalInfo);
}

export async function updateSavingPlanSheetInfo({
  sheetId,
  period,
  currency,
  name,
  sex,
  age,
}: {
  sheetId: string;
  period: string;
  currency: string;
  name: string;
  sex: string;
  age: number;
}): Promise<PlanCalWithCurrency> {
  const res = await api.put(`/sheet/${sheetId}/personalInfo`, {
    name,
    sex,
    age,
    period,
    currency,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as PlanCal), currency };
}

export function updateSavingPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // The cal endpoint is Axum `Json<i32>`: the body is the raw number, but it must be sent
  // as application/json — axios won't set that content-type for a primitive body, so set
  // it explicitly or the API returns 415.
  return api
    .put(`/sheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}

export function adjustSavingPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .put(`/sheet/${sheetId}/calAdjust`)
    .then((res) => res.data.data as PlanCal);
}

// --- Sheet page (the generated worksheet) -----------------------------------

/** `GET /sheet/{id}/data` — the raw worksheet as a grid of strings. */
export function getSavingPlanSheetData(sheetId: string): Promise<string[][]> {
  return api
    .get(`/sheet/${sheetId}/data`)
    .then((res) => res.data.data as string[][]);
}

/** `GET /sheet/{id}/cal` — the current installment/amount for the summary card. */
export function getSavingPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .get(`/sheet/${sheetId}/cal`)
    .then((res) => res.data.data as PlanCal);
}

/** `GET /sheet/{id}/discount` — per-year discount rates (as strings). */
export function getSavingPlanSheetDiscount(sheetId: string): Promise<string[]> {
  return api
    .get(`/sheet/${sheetId}/discount`)
    .then((res) => res.data.data as string[]);
}

/** `PUT /sheet/{id}/discount` — the full discount array (raw numbers). */
export async function updateSavingPlanSheetDiscount({
  sheetId,
  values,
}: {
  sheetId: string;
  values: number[];
}): Promise<void> {
  await api.put(`/sheet/${sheetId}/discount`, values);
}

/** `GET /sheet/{id}/prepaid` — per-year prepaid rates (as strings). */
export function getSavingPlanSheetPrepaid(sheetId: string): Promise<string[]> {
  return api
    .get(`/sheet/${sheetId}/prepaid`)
    .then((res) => res.data.data as string[]);
}

/** `PUT /sheet/{id}/prepaid` — the full prepaid array (raw numbers). */
export async function updateSavingPlanSheetPrepaid({
  sheetId,
  values,
}: {
  sheetId: string;
  values: number[];
}): Promise<void> {
  await api.put(`/sheet/${sheetId}/prepaid`, values);
}

/** `GET /sheet/{id}/prepaidStatus` — the "是否預交" selection (a backend literal). */
export function getSavingPlanSheetPrepaidStatus(
  sheetId: string,
): Promise<string> {
  return api
    .get(`/sheet/${sheetId}/prepaidStatus`)
    .then((res) => res.data.data as string);
}

/** `PUT /sheet/{id}/prepaidStatus` — a raw string body, so set application/json explicitly
 * (like {@link updateSavingPlanSheetCal}) or the Axum handler returns 415. */
export async function updateSavingPlanSheetPrepaidStatus({
  sheetId,
  value,
}: {
  sheetId: string;
  value: string;
}): Promise<void> {
  await api.put(`/sheet/${sheetId}/prepaidStatus`, value, {
    headers: { "Content-Type": "application/json" },
  });
}

/** `PUT /sheet/{id}/withdrawal` — set a withdrawal over rows [startRow, endRow]. */
export async function updateSavingPlanSheetWithdrawal({
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
  await api.put(`/sheet/${sheetId}/withdrawal`, { startRow, endRow, value });
}

/**
 * Whether to offer the "booster" uplift: a fresh (un-applied) suggestion exists, the
 * current expected installment still equals the pre-booster value, and the booster
 * actually raises it.
 */
export function isBoosterAvailable(
  beforeBooster: number | undefined,
  afterBooster: number | undefined,
  isBoosterApplied: boolean,
  expectedInstal: string,
): boolean {
  if (!afterBooster || !beforeBooster) return false;
  return (
    !isBoosterApplied &&
    beforeBooster === Number(expectedInstal) &&
    afterBooster > beforeBooster
  );
}
