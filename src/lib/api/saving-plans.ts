/**
 * Saving-plan API calls + the param screen's pure premium predicates.
 *
 * Unlike the mobile app these take NO token (the axios interceptor in `lib/api/client.ts`
 * attaches the Bearer from the `wv_token` cookie) and they do NOT swallow errors —
 * failures reject so react-query's `onError` can surface a toast. Responses use the API's
 * `{ data }` envelope, so everything unwraps `res.data.data`. Functions with several (or
 * same-typed) args take a single object so call sites are order-independent.
 */

import { api } from "@/lib/api/client";
import type {
  SavingPlanBooster,
  SavingPlanCal,
  SavingPlanCalWithCurrency,
  SavingPlanDetail,
  SavingPlanParam,
  SavingPlanPersonalInfo,
} from "@/types";

export function getSavingPlanDetail(planId: string): Promise<SavingPlanDetail> {
  return api
    .get(`/plan/${planId}`)
    .then((res) => res.data.data as SavingPlanDetail);
}

export function getSavingPlanStatus(planId: string): Promise<SavingPlanDetail> {
  return api
    .get(`/plan/${planId}/status`)
    .then((res) => res.data.data as SavingPlanDetail);
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
}): Promise<SavingPlanCalWithCurrency> {
  const res = await api.put(`/sheet/${sheetId}/personalInfo`, {
    name,
    sex,
    age,
    period,
    currency,
  });
  // The API doesn't echo the currency back; re-attach it (mirrors the mobile app).
  return { ...(res.data.data as SavingPlanCal), currency };
}

export function updateSavingPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<SavingPlanCal> {
  // The cal endpoint is Axum `Json<i32>`: the body is the raw number, but it must be sent
  // as application/json — axios won't set that content-type for a primitive body, so set
  // it explicitly or the API returns 415.
  return api
    .put(`/sheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as SavingPlanCal);
}

export function adjustSavingPlanSheetCal(
  sheetId: string,
): Promise<SavingPlanCal> {
  return api
    .put(`/sheet/${sheetId}/calAdjust`)
    .then((res) => res.data.data as SavingPlanCal);
}

/** The largest premium we'll send to the cal endpoint (mirrors the mobile guard). */
export const MAX_EXPECTED_INSTAL = 2 ** 32;

/** True when `value` exceeds what the backend will accept. */
export function isExpectedInstalTooLarge(value: string): boolean {
  return Number(value) > MAX_EXPECTED_INSTAL;
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
