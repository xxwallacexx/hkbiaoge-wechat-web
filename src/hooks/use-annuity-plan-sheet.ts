"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { buildAnnuityPlanSheetData } from "@/lib/annuity-plan-sheet";
import {
  getAnnuityDisplayType,
  getAnnuityInfo,
  getAnnuityPayoutPeriod,
  getAnnuityPlanDetail,
  getAnnuityPlanParam,
  getAnnuityPlanSheetBasicInfo,
  getAnnuityPlanSheetCal,
  getAnnuityPlanSheetData,
  getAnnuityPlanSheetInfo,
  getAnnuityPlanStatus,
  getCoupleAnnuityInfo,
} from "@/lib/api/annuity-plans";

/**
 * Data + derived view models for the annuity sheet screen (mirrors the webview server
 * component, re-architected client-side). Reads `planId`/`sheetId` from the URL, fetches plan
 * detail/status/param + worksheet data/basicInfo/info through the shared api client (auth from
 * the `wv_token` cookie, gated on `useAuthToken`), and slices the grid by plan type. Annuity
 * branches on `annuityPlanType`: GENERAL is a single table (and has no cal — the summary shows
 * the entered amount); DEFERED/IMMEDIATE are a premium/death two-tab split. The annuity /
 * couple-annuity / payout editors live in child components, which invalidate
 * `["annuityPlanSheet", sheetId]`; this hook subscribes to the same keys read-only, so the
 * screen can describe the selections without owning them.
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

  // The four reads below already run inside the bottom-bar editors under these exact keys, so
  // subscribing here shares their cache entries rather than adding a request. Each `enabled`
  // is the gate that editor uses, copied rather than re-derived — a wider one here would fire
  // the 409s they were written to avoid. Read at this level only so the screen can describe
  // the PDF it generates; nothing on the page renders them.
  const { data: displayType } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "displayType"],
    enabled,
    queryFn: () => getAnnuityDisplayType(sheetId),
  });

  const { data: annuityInfo } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "annuityInfo"],
    enabled,
    queryFn: () => getAnnuityInfo(sheetId),
  });

  // The payout editor is non-GENERAL only, and `/payoutPeriod` 409s without payout options.
  const { data: payoutPeriod } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "payoutPeriod"],
    enabled:
      enabled &&
      !isGeneral &&
      (planParam?.payoutPeriodOptions?.length ?? 0) > 0,
    queryFn: () => getAnnuityPayoutPeriod(sheetId),
  });

  // Couple annuity is rendered on GENERAL only, and 409s without `coupleAnnuityRange`.
  const { data: coupleAnnuityInfo } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "coupleAnnuityInfo"],
    enabled:
      enabled &&
      isGeneral &&
      (planParam?.coupleAnnuityTypeOptions?.length ?? 0) > 0,
    queryFn: () => getCoupleAnnuityInfo(sheetId),
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
    // Gated on the display-type flags, which are what decide whether the 年金 / 聯合年金 block
    // is on the generated sheet at all — so a consumer never describes a section the PDF does
    // not contain. The gate lives here rather than at the call site: one place, not two.
    annuityInfo: displayType?.isAnnuityEnabled ? annuityInfo : undefined,
    payoutPeriod: displayType?.isAnnuityEnabled ? payoutPeriod : undefined,
    coupleAnnuityInfo: displayType?.isCoupleAnnuityEnabled
      ? coupleAnnuityInfo
      : undefined,
  };
}
