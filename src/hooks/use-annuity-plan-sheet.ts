"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { buildAnnuityPlanSheetData } from "@/lib/annuity-plan-sheet";
import {
  getAnnuityPlanDetail,
  getAnnuityPlanParam,
  getAnnuityPlanSheetBasicInfo,
  getAnnuityPlanSheetCal,
  getAnnuityPlanSheetData,
  getAnnuityPlanSheetInfo,
  getAnnuityPlanStatus,
} from "@/lib/api/annuity-plans";

/**
 * Data + derived view models for the annuity sheet screen (mirrors the webview server
 * component, re-architected client-side). Reads `planId`/`sheetId` from the URL, fetches plan
 * detail/status/param + worksheet data/basicInfo/info through the shared api client (auth from
 * the `wv_token` cookie, gated on `useAuthToken`), and slices the grid by plan type. Annuity
 * branches on `annuityPlanType`: GENERAL is a single table (and has no cal — the summary shows
 * the entered amount); DEFERED/IMMEDIATE are a premium/death two-tab split. The annuity /
 * couple-annuity / payout editors live in child components, which invalidate
 * `["annuityPlanSheet", sheetId]`.
 */
export function useAnnuityPlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["annuityPlan", planId, "detail"],
    enabled,
    queryFn: () => getAnnuityPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["annuityPlan", planId, "status"],
    enabled,
    queryFn: () => getAnnuityPlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["annuityPlan", planId, "param"],
    enabled,
    queryFn: () => getAnnuityPlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getAnnuityPlanSheetData(sheetId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getAnnuityPlanSheetBasicInfo(sheetId),
  });

  const { data: sheetInfo } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "info"],
    enabled,
    queryFn: () => getAnnuityPlanSheetInfo(sheetId),
  });

  // GENERAL has no cal cells (the backend 409s `/cal`); its summary shows the entered amount
  // instead. Only fetch cal once `planParam` confirms the plan is non-GENERAL.
  const isGeneral = planParam?.annuityPlanType === "GENERAL";
  const { data: cal } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "cal"],
    enabled: enabled && !!planParam && !isGeneral,
    queryFn: () => getAnnuityPlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildAnnuityPlanSheetData(sheetData, planParam);
  }, [sheetData, planParam]);

  return {
    planId,
    sheetId,
    showLoading: !ready || !planDetail || !planParam || !planStatus,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    // GENERAL never loads cal — don't block readiness on it.
    isSheetReady: !!sheet && !!basicInfo && !!sheetInfo && (isGeneral || !!cal),
    planDetail,
    planParam,
    basicInfo,
    sheetInfo,
    cal,
    tableData: sheet?.tableData ?? [],
    premiumData: sheet?.premiumData ?? [],
    deathData: sheet?.deathData ?? [],
    withdrawalData: sheet?.withdrawalData ?? [],
    isGeneral,
  };
}
