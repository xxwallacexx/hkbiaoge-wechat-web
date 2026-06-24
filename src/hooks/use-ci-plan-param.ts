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
  getCiPlanDetail,
  getCiPlanParam,
  getCiPlanSheetBasicInfo,
  getCiPlanStatus,
  updateCiPlanSheetCal,
  updateCiPlanSheetInfo,
} from "@/lib/api/ci-plans";
import { isExpectedInstalTooLarge } from "@/lib/plan-premium";
import type { CiPlanParamFormValues } from "@/types";

/**
 * State, data, and mutations for the CI param screen (step 2/2; mirrors the mobile
 * `ciPlanParam`). Submits the period/currency/health/area form to compute a premium, then
 * debounces the "expected installment" into a cal recompute. No booster and no adjust
 * (unlike coupon/saving). Period options are filtered to the entered age as a ceiling
 * (`maxAge >= age`), health options as a floor (`minAge <= age`). `CiPlanParamScreen`
 * consumes this and only renders.
 */
export function useCiPlanParam() {
  const t = useTranslations("CiPlan");
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

  const expectedInstalDebounce = useDebounce(expectedInstal, 300);

  const { data: planDetail } = useQuery({
    queryKey: ["ciPlan", planId, "detail"],
    enabled,
    queryFn: () => getCiPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["ciPlan", planId, "status"],
    enabled,
    queryFn: () => getCiPlanStatus(planId),
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

  const { data: basicInfo } = useQuery({
    queryKey: ["ciPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getCiPlanSheetBasicInfo(sheetId),
  });

  const { mutate: submitCal, isPending: isCalSubmitting } = useMutation({
    mutationFn: (cal: number) => updateCiPlanSheetCal({ sheetId, value: cal }),
    onSuccess: (res) => {
      setInstal(res.instal);
      setAmount(res.amount);
    },
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitInfo, isPending: isSubmitting } = useMutation({
    mutationFn: (values: CiPlanParamFormValues) =>
      updateCiPlanSheetInfo({ sheetId, ...values }),
    onSuccess: (res) => {
      setAmount(res.amount);
      setInstal(res.instal);
      setCurrency(res.currency);
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
    router.push({ pathname: "/plans/ci/sheet", query: { planId, sheetId } });
  }

  // Recompute the cal whenever the (debounced) expected installment settles.
  useEffect(() => {
    if (expectedInstal === "") return;
    submitCal(Number(expectedInstalDebounce));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedInstalDebounce]);

  // Period options accommodate the age as a ceiling (maxAge >= age); health options as a
  // floor (minAge <= age). Currency/area are plain, unfiltered.
  const periodOptions =
    planParam && basicInfo
      ? planParam.periodOptions
          .filter((o) => o.maxAge >= basicInfo.age)
          .map((o) => o.value)
      : [];
  const healthOptions =
    planParam && basicInfo
      ? planParam.healthOptions
          .filter((o) => o.minAge <= basicInfo.age)
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
    healthOptions,
    areaOptions: planParam?.areaOptions ?? [],
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
    isCalSubmitting,
    onExpectedInstalChange,
    onGenerateSheetPress,
    goBack: () => router.back(),
  };
}
