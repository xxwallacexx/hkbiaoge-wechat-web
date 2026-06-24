"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "@/i18n/navigation";
import {
  adjustSavingPlanSheetCal,
  getSavingPlanBooster,
  getSavingPlanDetail,
  getSavingPlanParam,
  getSavingPlanSheetPersonalInfo,
  getSavingPlanStatus,
  isBoosterAvailable,
  isExpectedInstalTooLarge,
  updateSavingPlanSheetCal,
  updateSavingPlanSheetInfo,
} from "@/lib/api/saving-plans";
import type { SavingPlanParamFormValues } from "@/types";

/**
 * State, data, and mutations for the saving-plan param screen (mirrors the mobile
 * `savingPlanParam`). Reads `planId`/`sheetId` from the URL, polls plan status + personal
 * info to keep the sheet in sync (stopping once synced, and never looping on an
 * expired/unpaid plan), submits the param form to compute a premium, then debounces the
 * "expected installment" into a cal recompute with an optional booster and an adjust
 * fallback. `SavingPlanParamScreen` consumes this and only renders.
 */
export function useSavingPlanParam() {
  const t = useTranslations("SavingPlan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isPremiumSheetOpen, setIsPremiumSheetOpen] = useState(false);
  const [expectedInstal, setExpectedInstal] = useState("");
  const [instal, setInstal] = useState("0");
  const [amount, setAmount] = useState("0");
  const [isExpectedInstalError, setIsExpectedInstalError] = useState(false);
  const [currency, setCurrency] = useState("");
  const [beforeBooster, setBeforeBooster] = useState<number>();
  const [afterBooster, setAfterBooster] = useState<number>();
  const [isBoosterApplied, setIsBoosterApplied] = useState(false);

  const expectedInstalDebounce = useDebounce(expectedInstal, 300);

  const { data: planDetail } = useQuery({
    queryKey: ["savingPlan", planId, "detail"],
    enabled,
    queryFn: () => getSavingPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["savingPlan", planId, "status"],
    enabled,
    queryFn: () => getSavingPlanStatus(planId),
    // Poll to sync the sheet; stop once synced, and never loop on an expired/unpaid plan
    // (the backend only triggers a sync when paymentDetail is present).
    refetchInterval: (query) => {
      const status = query.state.data;
      if (status && !status.paymentDetail) return false;
      const synced =
        status?.sheetDetail?.isSynced === true &&
        !!status?.sheetDetail?.driveItemId;
      return synced ? false : 3000;
    },
  });

  const { data: personalInfo } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "personalInfo"],
    enabled,
    queryFn: () => getSavingPlanSheetPersonalInfo(sheetId),
    // Populated after the form is submitted; stop polling once it arrives.
    refetchInterval: (query) => (query.state.data ? false : 3000),
  });

  const { data: planParam } = useQuery({
    queryKey: ["savingPlan", planId, "param"],
    enabled,
    queryFn: () => getSavingPlanParam(planId),
  });

  const { mutate: submitBooster } = useMutation({
    mutationFn: (vars: { period: string; currency: string; instal: number }) =>
      getSavingPlanBooster({ planId, ...vars }),
    onSuccess: (res) => {
      setBeforeBooster(res.beforeBooster);
      setAfterBooster(res.afterBooster);
    },
  });

  // Shared success branch for cal + adjust: surface the new figures, flag a mismatch
  // against the expected installment, and otherwise fetch a fresh booster suggestion.
  function applyCalResult(
    instalNum: number,
    nextInstal: string,
    nextAmount: string,
  ) {
    setInstal(nextInstal);
    setAmount(nextAmount);
    if (Number(expectedInstal) !== instalNum) {
      setIsExpectedInstalError(true);
      return;
    }
    setIsExpectedInstalError(false);
    if (!personalInfo || isBoosterApplied) return;
    submitBooster({
      period: personalInfo.period.toString(),
      currency: personalInfo.currency,
      instal: Number(expectedInstal),
    });
  }

  const { mutate: submitCal, isPending: isCalSubmitting } = useMutation({
    mutationFn: (cal: number) =>
      updateSavingPlanSheetCal({ sheetId, value: cal }),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitAdjust, isPending: isAdjustSubmitting } = useMutation({
    mutationFn: () => adjustSavingPlanSheetCal(sheetId),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitInfo, isPending: isSubmitting } = useMutation({
    mutationFn: (values: SavingPlanParamFormValues) =>
      updateSavingPlanSheetInfo({ sheetId, ...values }),
    onSuccess: (res) => {
      setAmount(res.amount);
      setInstal(res.instal);
      setCurrency(res.currency);
      setIsPremiumSheetOpen(true);
      if (expectedInstal === "") return;
      setIsExpectedInstalError(Number(expectedInstal) !== res.instal_num);
    },
    onError: () => toast.error(t("paramInputError")),
  });

  // Set the expected installment, guarding against an out-of-range value.
  function changeExpectedInstal(value: string) {
    if (isExpectedInstalTooLarge(value)) {
      toast.error(t("expectedInstalTooLarge"));
      return;
    }
    setExpectedInstal(value);
  }

  function onBoosterPress() {
    setIsBoosterApplied(true);
    if (!afterBooster) return;
    changeExpectedInstal(afterBooster.toString());
  }

  function onGenerateSheetPress() {
    setIsPremiumSheetOpen(false);
    router.push({
      pathname: "/plans/saving/sheet",
      query: { planId, sheetId },
    });
  }

  // Recompute the cal whenever the (debounced) expected installment settles.
  useEffect(() => {
    if (expectedInstal === "") return;
    submitCal(Number(expectedInstalDebounce));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedInstalDebounce]);

  const isLoading = !planDetail || !planParam || !planStatus;

  return {
    planId,
    sheetId,
    showLoading: !ready || isLoading,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    planDetail,
    planParam,
    // info dialog
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    // param form
    onSubmit: submitInfo,
    isSubmitting,
    // premium sheet
    isPremiumSheetOpen,
    setIsPremiumSheetOpen,
    expectedInstal,
    currency,
    amount,
    instal,
    isExpectedInstalError,
    isCalSubmitting,
    // editing the input resets an applied booster (mirrors the mobile wrapper).
    onExpectedInstalChange: (value: string) => {
      setIsBoosterApplied(false);
      changeExpectedInstal(value);
    },
    isAdjustSubmitting,
    onAdjustSubmit: () => submitAdjust(),
    onGenerateSheetPress,
    isBoosterAvailable: isBoosterAvailable(
      beforeBooster,
      afterBooster,
      isBoosterApplied,
      expectedInstal,
    ),
    isBoosterApplied,
    onBoosterPress,
    beforeBooster,
    afterBooster,
  };
}
