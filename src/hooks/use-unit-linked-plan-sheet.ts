"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import {
  getUnitLinkedPlanDetail,
  getUnitLinkedPlanParam,
  getUnitLinkedPlanSheetBasicInfo,
  getUnitLinkedPlanSheetCal,
  getUnitLinkedPlanSheetData,
  getUnitLinkedPlanSheetInfo,
  getUnitLinkedPlanStatus,
} from "@/lib/api/unit-linked-plans";
import { buildUnitLinkedPlanSheetData } from "@/lib/unit-linked-plan-sheet";

/**
 * Data + derived view models for the unit-linked sheet screen (mirrors the webview server
 * component, re-architected client-side). Reads `planId`/`sheetId` from the URL, fetches plan
 * detail/status/param + worksheet data/basicInfo/info/cal through the shared api client (auth
 * from the `wv_token` cookie, gated on `useAuthToken`), and slices the grid into the single
 * 10-column table + the withdrawal view model. Unit-linked has one table (no premium/death
 * split); the type-B health/area + custom-parameter editors live in child components, which
 * invalidate `["unitLinkedPlanSheet", sheetId]`.
 */
export function useUnitLinkedPlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "detail"],
    enabled,
    queryFn: () => getUnitLinkedPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "status"],
    enabled,
    queryFn: () => getUnitLinkedPlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "param"],
    enabled,
    queryFn: () => getUnitLinkedPlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getUnitLinkedPlanSheetData(sheetId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getUnitLinkedPlanSheetBasicInfo(sheetId),
  });

  const { data: sheetInfo } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "info"],
    enabled,
    queryFn: () => getUnitLinkedPlanSheetInfo(sheetId),
  });

  const { data: cal } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "cal"],
    enabled,
    queryFn: () => getUnitLinkedPlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildUnitLinkedPlanSheetData(sheetData, planParam);
  }, [sheetData, planParam]);

  // The health/area + custom-parameter editors are type-B-only (the backend 409s them for
  // type A), so derive the gate from `planType` here rather than in the screen.
  const isTypeB = planParam?.planType === "B";

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
    tableData: sheet?.tableData ?? [],
    withdrawalData: sheet?.withdrawalData ?? [],
    isTypeB,
    hasHealthArea: isTypeB && !!planParam?.areaCell && !!planParam?.healthCell,
  };
}
