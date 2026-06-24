/**
 * Annuity-plan (the "annuity" tab) API calls. Same conventions as `unit-linked-plans.ts`: NO
 * token arg (the axios interceptor injects the Bearer), errors reject (no swallow), responses
 * unwrap `res.data.data`, and multi-arg functions take a single object. No booster. Reads under
 * `/annuityPlan/*`, writes under `/annuitySheet/*`. The param step branches on the plan's
 * `annuityPlanType`: GENERAL writes an `amount` in `/info` then goes straight to the sheet;
 * non-GENERAL opens a premium sheet (`/cal` + `/calAdjust`). Every submit also resets the
 * displayed-type flags via `/annuityDisplayedType` (mirrors the mobile app).
 */

import { api } from "@/lib/api/client";
import type {
  AnnuityPlanParam,
  AnnuityPlanSheetBasicInfo,
  PlanCal,
  PlanDetail,
} from "@/types";

export function getAnnuityPlanDetail(planId: string): Promise<PlanDetail> {
  return api
    .get(`/annuityPlan/${planId}`)
    .then((res) => res.data.data as PlanDetail);
}

export function getAnnuityPlanStatus(planId: string): Promise<PlanDetail> {
  return api
    .get(`/annuityPlan/${planId}/status`)
    .then((res) => res.data.data as PlanDetail);
}

export function getAnnuityPlanParam(planId: string): Promise<AnnuityPlanParam> {
  return api
    .get(`/annuityPlan/${planId}/param`)
    .then((res) => res.data.data as AnnuityPlanParam);
}

export function getAnnuityPlanSheetBasicInfo(
  sheetId: string,
): Promise<AnnuityPlanSheetBasicInfo> {
  return api
    .get(`/annuitySheet/${sheetId}/basicInfo`)
    .then((res) => res.data.data as AnnuityPlanSheetBasicInfo);
}

export function updateAnnuityPlanSheetBasicInfo({
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
    .put(`/annuitySheet/${sheetId}/basicInfo`, { name, sex, age })
    .then(() => undefined);
}

export function updateAnnuityPlanSheetInfo({
  sheetId,
  period,
  currency,
  amount,
}: {
  sheetId: string;
  period: string;
  currency: string;
  amount?: string;
}): Promise<void> {
  // `amount` is sent only for GENERAL plans; the response echoes the info and is unused.
  return api
    .put(`/annuitySheet/${sheetId}/info`, {
      period,
      currency,
      ...(amount !== undefined ? { amount } : {}),
    })
    .then(() => undefined);
}

export function updateAnnuityDisplayedType({
  sheetId,
  isAnnuityEnabled,
  isCoupleAnnuityEnabled,
}: {
  sheetId: string;
  isAnnuityEnabled: boolean;
  isCoupleAnnuityEnabled: boolean;
}): Promise<void> {
  // Mandatory side-effect on every info submit (mobile sends `false, false`).
  return api
    .put(`/annuitySheet/${sheetId}/annuityDisplayedType`, {
      isAnnuityEnabled,
      isCoupleAnnuityEnabled,
    })
    .then(() => undefined);
}

export function getAnnuityPlanSheetCal(sheetId: string): Promise<PlanCal> {
  // Non-GENERAL: the initial cal fetched after submitting the info (the info PUT doesn't return it).
  return api
    .get(`/annuitySheet/${sheetId}/cal`)
    .then((res) => res.data.data as PlanCal);
}

export function updateAnnuityPlanSheetCal({
  sheetId,
  value,
}: {
  sheetId: string;
  value: number;
}): Promise<PlanCal> {
  // Axum `Json<i32>`: the body is the raw number but must be application/json (axios won't set
  // that for a primitive body), else the API returns 415.
  return api
    .put(`/annuitySheet/${sheetId}/cal`, value, {
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => res.data.data as PlanCal);
}

export function adjustAnnuityPlanSheetCal(sheetId: string): Promise<PlanCal> {
  return api
    .put(`/annuitySheet/${sheetId}/calAdjust`)
    .then((res) => res.data.data as PlanCal);
}
