"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import {
  getWholelifePlanDetail,
  getWholelifePlanParam,
  getWholelifePlanSheetBasicInfo,
  getWholelifePlanSheetCal,
  getWholelifePlanSheetData,
  getWholelifePlanSheetInfo,
  getWholelifePlanStatus,
} from "@/lib/api/wholelife-plans";
import { buildWholelifePlanSheetData } from "@/lib/wholelife-plan-sheet";

/**
 * Data + derived view models for the whole-life sheet screen (mirrors the webview server
 * component, re-architected client-side). Reads `planId`/`sheetId` from the URL, fetches plan
 * detail/status/param + worksheet data/basicInfo/info/cal through the shared api client (auth
 * from the `wv_token` cookie, gated on `useAuthToken`), and slices the grid into the
 * premium/death/withdrawal view models. The withdrawal feature is param-gated on
 * `planParam.withdrawalCol` (the transform + the screen both branch on it). The withdrawal
 * mutation lives in the child components, which invalidate `["wholelifePlanSheet", sheetId]`.
 */
export function useWholelifePlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["wholelifePlan", planId, "detail"],
    enabled,
    queryFn: () => getWholelifePlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["wholelifePlan", planId, "status"],
    enabled,
    queryFn: () => getWholelifePlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["wholelifePlan", planId, "param"],
    enabled,
    queryFn: () => getWholelifePlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["wholelifePlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getWholelifePlanSheetData(sheetId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["wholelifePlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getWholelifePlanSheetBasicInfo(sheetId),
  });

  const { data: sheetInfo } = useQuery({
    queryKey: ["wholelifePlanSheet", sheetId, "info"],
    enabled,
    queryFn: () => getWholelifePlanSheetInfo(sheetId),
  });

  const { data: cal } = useQuery({
    queryKey: ["wholelifePlanSheet", sheetId, "cal"],
    enabled,
    queryFn: () => getWholelifePlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildWholelifePlanSheetData(sheetData, planParam);
  }, [sheetData, planParam]);

  return {
    planId,
    sheetId,
    // Core metadata gate (mirrors the param hook): once detail/param/status load we can
    // decide expired-vs-render without waiting on the heavier sheet payloads.
    showLoading: !ready || !planDetail || !planParam || !planStatus,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    isSheetReady: !!sheet && !!basicInfo && !!sheetInfo && !!cal,
    planDetail,
    planParam,
    basicInfo,
    sheetInfo,
    cal,
    premiumData: sheet?.premiumData ?? [],
    deathData: sheet?.deathData ?? [],
    withdrawalData: sheet?.withdrawalData ?? [],
  };
}
