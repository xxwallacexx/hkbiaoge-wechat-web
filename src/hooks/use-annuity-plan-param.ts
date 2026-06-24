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
  adjustAnnuityPlanSheetCal,
  getAnnuityPlanDetail,
  getAnnuityPlanParam,
  getAnnuityPlanSheetBasicInfo,
  getAnnuityPlanSheetCal,
  getAnnuityPlanStatus,
  updateAnnuityDisplayedType,
  updateAnnuityPlanSheetCal,
  updateAnnuityPlanSheetInfo,
} from "@/lib/api/annuity-plans";
import { isExpectedInstalTooLarge } from "@/lib/plan-premium";

/**
 * State, data, and mutations for the annuity param screen (step 2/2; mirrors the mobile
 * `annuityPlanParam`). Branches on `annuityPlanType`:
 *   GENERAL → submit (period/currency/amount) writes info + resets the displayed-type flags,
 *     then navigates straight to the sheet (no premium bottom-sheet).
 *   non-GENERAL → submit (period/currency) writes info + resets flags, then fetches the initial
 *     cal and opens the premium sheet (debounced cal + adjust, like coupon). No booster.
 * `AnnuityPlanParamScreen` consumes this and only renders.
 */
export function useAnnuityPlanParam() {
  const t = useTranslations("AnnuityPlan");
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
  const [currency, setCurrency] = useState("");
  const [isExpectedInstalError, setIsExpectedInstalError] = useState(false);

  const expectedInstalDebounce = useDebounce(expectedInstal, 300);

  const { data: planDetail } = useQuery({
    queryKey: ["annuityPlan", planId, "detail"],
    enabled,
    queryFn: () => getAnnuityPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["annuityPlan", planId, "status"],
    enabled,
    queryFn: () => getAnnuityPlanStatus(planId),
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

  const { data: basicInfo } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getAnnuityPlanSheetBasicInfo(sheetId),
  });

  const isGeneral = planParam?.annuityPlanType === "GENERAL";

  // Shared cal + adjust success branch: surface the figures and flag a mismatch (non-GENERAL).
  function applyCalResult(
    instalNum: number,
    nextInstal: string,
    nextAmount: string,
  ) {
    setInstal(nextInstal);
    setAmount(nextAmount);
    setIsExpectedInstalError(Number(expectedInstal) !== instalNum);
  }

  const { mutate: submitCal, isPending: isCalSubmitting } = useMutation({
    mutationFn: (cal: number) =>
      updateAnnuityPlanSheetCal({ sheetId, value: cal }),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitAdjust, isPending: isAdjustSubmitting } = useMutation({
    mutationFn: () => adjustAnnuityPlanSheetCal(sheetId),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitInfo, isPending: isSubmitting } = useMutation({
    mutationFn: async (values: {
      period: string;
      currency: string;
      amount?: string;
    }) => {
      await updateAnnuityPlanSheetInfo({
        sheetId,
        period: values.period,
        currency: values.currency,
        amount: values.amount,
      });
      // Reset the displayed-type flags on every submit (mirrors the mobile app).
      await updateAnnuityDisplayedType({
        sheetId,
        isAnnuityEnabled: false,
        isCoupleAnnuityEnabled: false,
      });
      // GENERAL has no premium sheet; non-GENERAL fetches its initial cal.
      return isGeneral ? null : getAnnuityPlanSheetCal(sheetId);
    },
    onSuccess: (cal, values) => {
      if (isGeneral || !cal) {
        router.push({
          pathname: "/plans/annuity/sheet",
          query: { planId, sheetId },
        });
        return;
      }
      setCurrency(values.currency);
      setAmount(cal.amount);
      setInstal(cal.instal);
      setIsPremiumSheetOpen(true);
    },
    onError: () => toast.error(t("paramInputError")),
  });

  function onExpectedInstalChange(value: string) {
    if (isExpectedInstalTooLarge(value)) {
      toast.error(t("expectedInstalTooLarge"));
      return;
    }
    setExpectedInstal(value);
  }

  function onGenerateSheetPress() {
    setIsPremiumSheetOpen(false);
    router.push({
      pathname: "/plans/annuity/sheet",
      query: { planId, sheetId },
    });
  }

  // Recompute the cal whenever the (debounced) expected installment settles (non-GENERAL).
  useEffect(() => {
    if (expectedInstal === "") return;
    submitCal(Number(expectedInstalDebounce));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedInstalDebounce]);

  // Non-GENERAL period options accommodate the entered age as a ceiling (maxAge >= age).
  const periodOptions =
    planParam?.periodOptions && basicInfo
      ? planParam.periodOptions
          .filter((o) => o.maxAge >= basicInfo.age)
          .map((o) => o.value)
      : [];

  return {
    planId,
    sheetId,
    showLoading:
      !ready || !planDetail || !planParam || !planStatus || !basicInfo,
    isExpired: !!planStatus && !planStatus.paymentDetail,
    planDetail,
    isGeneral,
    periodConstraint: planParam?.periodConstraint,
    periodOptions,
    currencyOptions: planParam?.currencyOptions ?? [],
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit: submitInfo,
    isSubmitting,
    isPremiumSheetOpen,
    setIsPremiumSheetOpen,
    expectedInstal,
    currency,
    amount,
    instal,
    isExpectedInstalError,
    isCalSubmitting,
    onExpectedInstalChange,
    isAdjustSubmitting,
    onAdjustSubmit: () => submitAdjust(),
    onGenerateSheetPress,
    goBack: () => router.back(),
  };
}
