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
  adjustCouponPlanSheetCal,
  getCouponPlanDetail,
  getCouponPlanParam,
  getCouponPlanSheetBasicInfo,
  getCouponPlanStatus,
  updateCouponPlanSheetCal,
  updateCouponPlanSheetInfo,
} from "@/lib/api/coupon-plans";
import { isExpectedInstalTooLarge } from "@/lib/plan-premium";
import type { CouponPlanParamFormValues } from "@/types";

/**
 * State, data, and mutations for the coupon param screen (step 2/2; mirrors the mobile
 * `couponPlanParam`). Submits the period/currency/dividend form to compute a premium, then
 * debounces the "expected installment" into a cal recompute with an adjust fallback. No
 * booster (unlike saving). Period options are filtered to the entered age. The
 * `CouponPlanParamScreen` consumes this and only renders.
 */
export function useCouponPlanParam() {
  const t = useTranslations("CouponPlan");
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

  const expectedInstalDebounce = useDebounce(expectedInstal, 300);

  const { data: planDetail } = useQuery({
    queryKey: ["couponPlan", planId, "detail"],
    enabled,
    queryFn: () => getCouponPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["couponPlan", planId, "status"],
    enabled,
    queryFn: () => getCouponPlanStatus(planId),
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
    queryKey: ["couponPlan", planId, "param"],
    enabled,
    queryFn: () => getCouponPlanParam(planId),
  });

  const { data: basicInfo } = useQuery({
    queryKey: ["couponPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getCouponPlanSheetBasicInfo(sheetId),
  });

  // Shared success branch for cal + adjust: surface the figures and flag a mismatch.
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
      updateCouponPlanSheetCal({ sheetId, value: cal }),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitAdjust, isPending: isAdjustSubmitting } = useMutation({
    mutationFn: () => adjustCouponPlanSheetCal(sheetId),
    onSuccess: (res) => applyCalResult(res.instal_num, res.instal, res.amount),
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitInfo, isPending: isSubmitting } = useMutation({
    mutationFn: (values: CouponPlanParamFormValues) =>
      updateCouponPlanSheetInfo({ sheetId, ...values }),
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
      pathname: "/plans/coupon/sheet",
      query: { planId, sheetId },
    });
  }

  // Recompute the cal whenever the (debounced) expected installment settles.
  useEffect(() => {
    if (expectedInstal === "") return;
    submitCal(Number(expectedInstalDebounce));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedInstalDebounce]);

  // Period options whose max age accommodates the entered age (mirrors the mobile filter).
  const periodOptions =
    planParam && basicInfo
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
    periodOptions,
    currencyOptions: planParam?.currencyOptions ?? [],
    dividendOptions: planParam?.dividendOptions ?? [],
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
