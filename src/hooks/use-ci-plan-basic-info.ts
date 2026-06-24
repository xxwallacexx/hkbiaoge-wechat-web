"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useRouter } from "@/i18n/navigation";
import {
  getCiPlanDetail,
  getCiPlanParam,
  getCiPlanStatus,
  updateCiPlanSheetBasicInfo,
} from "@/lib/api/ci-plans";
import type { CiPlanBasicInfoFormValues } from "@/types";

/**
 * State + data for the CI basic-info screen (step 1/2; mirrors the mobile `ciPlanBasicInfo`).
 * Reads `planId`/`sheetId` from the URL, polls plan status to keep the sheet in sync
 * (stopping once synced / on an expired plan), and submits name/sex/age before navigating
 * to the param step. `CiPlanBasicInfoScreen` consumes this.
 */
export function useCiPlanBasicInfo() {
  const t = useTranslations("CiPlan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const { data: planDetail } = useQuery({
    queryKey: ["ciPlan", planId, "detail"],
    enabled,
    queryFn: () => getCiPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["ciPlan", planId, "status"],
    enabled,
    queryFn: () => getCiPlanStatus(planId),
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
    queryKey: ["ciPlan", planId, "param"],
    enabled,
    queryFn: () => getCiPlanParam(planId),
  });

  const { mutate: onSubmit, isPending: isSubmitting } = useMutation({
    mutationFn: (values: CiPlanBasicInfoFormValues) =>
      updateCiPlanSheetBasicInfo({ sheetId, ...values }),
    onSuccess: () =>
      router.push({
        pathname: "/plans/ci/param",
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
