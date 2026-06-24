"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import {
  getCouponPlanDetail,
  getCouponPlanParam,
  getCouponPlanSheetBasicInfo,
  getCouponPlanSheetCal,
  getCouponPlanSheetData,
  getCouponPlanSheetInfo,
  getCouponPlanStatus,
} from "@/lib/api/coupon-plans";
import { buildCouponPlanSheetData } from "@/lib/coupon-plan-sheet";

/**
 * Data + derived view models for the coupon-plan sheet screen (mirrors the webview server
 * component, re-architected client-side, following `use-saving-plan-sheet`). Reads
 * `planId`/`sheetId` from the URL — the coupon param screen navigates here with them as
 * query params — fetches the plan detail/status/param plus the worksheet data + basicInfo +
 * info + cal through the shared api client (auth from the `wv_token` cookie, gated on
 * `useAuthToken`), and slices the raw grid into the premium/death/withdrawal view models.
 * Coupon splits saving's single `personalInfo` into `basicInfo` (name/sex/age) + `info`
 * (period/currency/dividend) and has no discount/prepaid editors. Withdrawal mutations live
 * in the child components, which invalidate `["couponPlanSheet", sheetId]`.
 */
export function useCouponPlanSheet() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const { data: planDetail } = useQuery({
    queryKey: ["couponPlan", planId, "detail"],
    enabled,
    queryFn: () => getCouponPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["couponPlan", planId, "status"],
    enabled,
    queryFn: () => getCouponPlanStatus(planId),
  });

  const { data: planParam } = useQuery({
    queryKey: ["couponPlan", planId, "param"],
    enabled,
    queryFn: () => getCouponPlanParam(planId),
  });

  const { data: sheetData } = useQuery({
    queryKey: ["couponPlanSheet", sheetId, "data"],
    enabled,
    queryFn: () => getCouponPlanSheetData(sheetId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["couponPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getCouponPlanSheetBasicInfo(sheetId),
  });

  const { data: sheetInfo } = useQuery({
    queryKey: ["couponPlanSheet", sheetId, "info"],
    enabled,
    queryFn: () => getCouponPlanSheetInfo(sheetId),
  });

  const { data: cal } = useQuery({
    queryKey: ["couponPlanSheet", sheetId, "cal"],
    enabled,
    queryFn: () => getCouponPlanSheetCal(sheetId),
  });

  const sheet = useMemo(() => {
    if (!sheetData || !planParam) return null;
    return buildCouponPlanSheetData(sheetData, planParam);
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
