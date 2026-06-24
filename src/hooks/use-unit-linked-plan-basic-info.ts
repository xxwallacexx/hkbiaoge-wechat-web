"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useRouter } from "@/i18n/navigation";
import {
  getUnitLinkedPlanDetail,
  getUnitLinkedPlanParam,
  getUnitLinkedPlanStatus,
  updateUnitLinkedPlanSheetBasicInfo,
} from "@/lib/api/unit-linked-plans";
import type { UnitLinkedPlanBasicInfoFormValues } from "@/types";

/**
 * State + data for the unit-linked basic-info screen (step 1/2; mirrors the mobile
 * `unitLinkedPlanBasicInfo`). Reads `planId`/`sheetId` from the URL, polls plan status to keep
 * the sheet in sync (stopping once synced / on an expired plan), and submits name/sex/age
 * before navigating to the param step. `UnitLinkedPlanBasicInfoScreen` consumes this.
 */
export function useUnitLinkedPlanBasicInfo() {
  const t = useTranslations("UnitLinkedPlan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { data: planDetail } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "detail"],
    enabled,
    queryFn: () => getUnitLinkedPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "status"],
    enabled,
    queryFn: () => getUnitLinkedPlanStatus(planId),
    // Poll to sync the sheet; stop once synced, and never loop on an expired/unpaid plan.
    refetchInterval: (query) => {
      const status = query.state.data;
      if (status && !status.paymentDetail) return false;
      const synced =
        status?.sheetDetail?.isSynced === true &&
        !!status?.sheetDetail?.driveItemId;
      return synced ? false : 3000;
    },
  });

  const { data: planParam } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "param"],
    enabled,
    queryFn: () => getUnitLinkedPlanParam(planId),
  });

  const { mutate: onSubmit, isPending: isSubmitting } = useMutation({
    mutationFn: (values: UnitLinkedPlanBasicInfoFormValues) =>
      updateUnitLinkedPlanSheetBasicInfo({ sheetId, ...values }),
    onSuccess: () =>
      router.push({
        pathname: "/plans/unitLinked/param",
        query: { planId, sheetId },
      }),
    onError: () => toast.error(t("paramInputError")),
  });

  // The highest insurable age across the plan's period options (mirrors the mobile bound).
  const maxAge = planParam?.periodOptions.length
    ? Math.max(...planParam.periodOptions.map((o) => o.maxAge))
    : 0;

  return {
    planId,
    sheetId,
    showLoading: !ready || !planDetail || !planParam || !planStatus,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    planDetail,
    minAge: planParam?.minAge ?? 0,
    maxAge,
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit,
    isSubmitting,
  };
}
