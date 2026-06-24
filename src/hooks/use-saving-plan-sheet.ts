"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import {
  getSavingPlanDetail,
  getSavingPlanParam,
  getSavingPlanSheetCal,
  getSavingPlanSheetData,
  getSavingPlanSheetPersonalInfo,
  getSavingPlanStatus,
} from "@/lib/api/saving-plans";
import { buildSavingPlanSheetData } from "@/lib/saving-plan-sheet";

/**
 * Data + derived view models for the saving-plan sheet screen (mirrors the webview server
 * component, re-architected client-side). Reads `planId`/`sheetId` from the URL — the param
 * screen navigates here with them as query params — fetches the plan detail/status/param
 * plus the worksheet data/personalInfo/cal through the shared api client (auth comes from
 * the `wv_token` cookie, gated on `useAuthToken`), and slices the raw grid into the
 * premium/death/withdrawal view models. Mutations live in the interactive child components,
 * which invalidate the `["savingPlanSheet", sheetId]` keys to refresh this data.
 */
export function useSavingPlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["savingPlan", planId, "detail"],
    enabled,
    queryFn: () => getSavingPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["savingPlan", planId, "status"],
    enabled,
    queryFn: () => getSavingPlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["savingPlan", planId, "param"],
    enabled,
    queryFn: () => getSavingPlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getSavingPlanSheetData(sheetId),
  });

  const { data: personalInfo } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "personalInfo"],
    enabled,
    queryFn: () => getSavingPlanSheetPersonalInfo(sheetId),
  });

  const { data: cal } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "cal"],
    enabled,
    queryFn: () => getSavingPlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildSavingPlanSheetData(sheetData, planParam);
  }, [sheetData, planParam]);

  return {
    planId,
    sheetId,
    // Core metadata gate (mirrors the param hook): once detail/param/status load we can
    // decide expired-vs-render without waiting on the heavier sheet payloads.
    showLoading: !ready || !planDetail || !planParam || !planStatus,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    isSheetReady: !!sheet && !!personalInfo && !!cal,
    planDetail,
    planParam,
    personalInfo,
    cal,
    premiumData: sheet?.premiumData ?? [],
    deathData: sheet?.deathData ?? [],
    withdrawalData: sheet?.withdrawalData ?? [],
  };
}
