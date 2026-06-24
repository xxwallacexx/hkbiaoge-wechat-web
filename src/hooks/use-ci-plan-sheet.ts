"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import {
  getCiPlanDetail,
  getCiPlanParam,
  getCiPlanSheetBasicInfo,
  getCiPlanSheetCal,
  getCiPlanSheetData,
  getCiPlanSheetInfo,
  getCiPlanStatus,
} from "@/lib/api/ci-plans";
import { buildCiPlanSheetData } from "@/lib/ci-plan-sheet";

/**
 * Data + derived view models for the CI-plan sheet screen (mirrors the webview server
 * component, re-architected client-side, following `use-coupon-plan-sheet`). Reads
 * `planId`/`sheetId` from the URL, fetches plan detail/status/param + worksheet
 * data/basicInfo/info/cal through the shared api client (auth from the `wv_token` cookie,
 * gated on `useAuthToken`), and slices the grid into premium/death view models. CI has NO
 * withdrawal / discount / prepaid editors, so this is read-only — no mutations.
 */
export function useCiPlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["ciPlan", planId, "detail"],
    enabled,
    queryFn: () => getCiPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["ciPlan", planId, "status"],
    enabled,
    queryFn: () => getCiPlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["ciPlan", planId, "param"],
    enabled,
    queryFn: () => getCiPlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["ciPlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getCiPlanSheetData(sheetId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["ciPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getCiPlanSheetBasicInfo(sheetId),
  });

  const { data: sheetInfo } = useQuery({
    queryKey: ["ciPlanSheet", sheetId, "info"],
    enabled,
    queryFn: () => getCiPlanSheetInfo(sheetId),
  });

  const { data: cal } = useQuery({
    queryKey: ["ciPlanSheet", sheetId, "cal"],
    enabled,
    queryFn: () => getCiPlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildCiPlanSheetData(sheetData, planParam);
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
  };
}
