"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useRouter } from "@/i18n/navigation";
import {
  getAnnuityPlanDetail,
  getAnnuityPlanParam,
  getAnnuityPlanStatus,
  updateAnnuityPlanSheetBasicInfo,
} from "@/lib/api/annuity-plans";
import type { AnnuityPlanBasicInfoFormValues } from "@/types";

/**
 * State + data for the annuity basic-info screen (step 1/2; mirrors the mobile
 * `annuityPlanBasicInfo`). Reads `planId`/`sheetId` from the URL, polls plan status to keep the
 * sheet in sync (stopping once synced / on an expired plan), and submits name/sex/age before
 * navigating to the param step. `AnnuityPlanBasicInfoScreen` consumes this.
 */
export function useAnnuityPlanBasicInfo() {
  const t = useTranslations("AnnuityPlan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { data: planDetail } = useQuery({
    queryKey: ["annuityPlan", planId, "detail"],
    enabled,
    queryFn: () => getAnnuityPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["annuityPlan", planId, "status"],
    enabled,
    queryFn: () => getAnnuityPlanStatus(planId),
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
    queryKey: ["annuityPlan", planId, "param"],
    enabled,
    queryFn: () => getAnnuityPlanParam(planId),
  });

  const { mutate: onSubmit, isPending: isSubmitting } = useMutation({
    mutationFn: (values: AnnuityPlanBasicInfoFormValues) =>
      updateAnnuityPlanSheetBasicInfo({ sheetId, ...values }),
    onSuccess: () =>
      router.push({
        pathname: "/plans/annuity/param",
        query: { planId, sheetId },
      }),
    onError: () => toast.error(t("paramInputError")),
  });

  return {
    planId,
    sheetId,
    showLoading: !ready || !planDetail || !planParam || !planStatus,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    planDetail,
    // The annuity param response carries minAge/maxAge directly (unlike the others, which
    // derive maxAge from the period options — those are optional here).
    minAge: planParam?.minAge ?? 0,
    maxAge: planParam?.maxAge ?? 0,
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit,
    isSubmitting,
    goBack: () => router.back(),
  };
}
