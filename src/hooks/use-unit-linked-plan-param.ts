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
  getUnitLinkedPlanDetail,
  getUnitLinkedPlanParam,
  getUnitLinkedPlanSheetBasicInfo,
  getUnitLinkedPlanStatus,
  updateUnitLinkedPlanSheetAmount,
  updateUnitLinkedPlanSheetCal,
  updateUnitLinkedPlanSheetInfo,
  updateUnitLinkedPlanSheetInstall,
} from "@/lib/api/unit-linked-plans";
import { isExpectedInstalTooLarge } from "@/lib/plan-premium";
import type { UnitLinkedPlanParamFormValues } from "@/types";

/**
 * State, data, and mutations for the unit-linked param screen (step 2/2; mirrors the mobile
 * `unitLinkedPlanParam`). Submits the period/currency/currentInterestRate form, then the
 * premium bottom-sheet branches on `planType`:
 *   A → the debounced input drives `PUT /cal` (amount + premium), then generate.
 *   B → the debounced input drives `PUT /amount` (a premium range); "Next" opens a second
 *       sheet to pick an installment within the range, which `PUT /install`s, then generate.
 * No booster, no adjust. `UnitLinkedPlanParamScreen` consumes this and only renders.
 */
export function useUnitLinkedPlanParam() {
  const t = useTranslations("UnitLinkedPlan");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") ?? "";
  const sheetId = searchParams.get("sheetId") ?? "";
  const { ready, isAuthenticated } = useAuthToken();
  const enabled = isAuthenticated && !!planId && !!sheetId;

  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isPremiumSheetOpen, setIsPremiumSheetOpen] = useState(false);
  const [isInstalSheetOpen, setIsInstalSheetOpen] = useState(false);
  const [expectedInstal, setExpectedInstal] = useState("");
  const [instal, setInstal] = useState("0");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("");
  const [estimatedInstal, setEstimatedInstal] = useState<number>();
  const [maxInstal, setMaxInstal] = useState<number>();

  const expectedInstalDebounce = useDebounce(expectedInstal, 300);

  const { data: planDetail } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "detail"],
    enabled,
    queryFn: () => getUnitLinkedPlanDetail(planId),
  });

  const { data: planStatus } = useQuery({
    queryKey: ["unitLinkedPlan", planId, "status"],
    enabled,
    queryFn: () => getUnitLinkedPlanStatus(planId),
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

  const { data: basicInfo } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "basicInfo"],
    enabled,
    queryFn: () => getUnitLinkedPlanSheetBasicInfo(sheetId),
  });

  const planType = planParam?.planType;

  const { mutate: submitCal, isPending: isCalSubmitting } = useMutation({
    mutationFn: (value: number) =>
      updateUnitLinkedPlanSheetCal({ sheetId, value }),
    onSuccess: (res) => {
      setInstal(res.instal);
      setAmount(res.amount);
    },
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitAmount, isPending: isAmountSubmitting } = useMutation({
    mutationFn: (value: number) =>
      updateUnitLinkedPlanSheetAmount({ sheetId, value }),
    onSuccess: (res) => {
      setEstimatedInstal(res.estimatedInstal);
      setMaxInstal(res.maxInstal);
      setAmount(res.amount);
    },
    onError: () => toast.error(t("inputPremiumError")),
  });

  const { mutate: submitInfo, isPending: isSubmitting } = useMutation({
    mutationFn: (values: UnitLinkedPlanParamFormValues) =>
      updateUnitLinkedPlanSheetInfo({ sheetId, ...values }),
    onSuccess: (res) => {
      setAmount(res.amount);
      setInstal(res.instal);
      setCurrency(res.currency);
      setIsPremiumSheetOpen(true);
    },
    onError: () => toast.error(t("paramInputError")),
  });

  const { mutate: submitInstall, isPending: isInstallSubmitting } = useMutation(
    {
      mutationFn: (value: number) =>
        updateUnitLinkedPlanSheetInstall({ sheetId, value }),
      onSuccess: () => {
        setIsInstalSheetOpen(false);
        router.push({
          pathname: "/plans/unitLinked/sheet",
          query: { planId, sheetId },
        });
      },
      onError: () => toast.error(t("paramInputError")),
    },
  );

  function onExpectedInstalChange(value: string) {
    if (isExpectedInstalTooLarge(value)) {
      toast.error(t("expectedInstalTooLarge"));
      return;
    }
    setExpectedInstal(value);
  }

  // Type A: generate straight from the premium sheet.
  function onGenerateSheetPress() {
    setIsPremiumSheetOpen(false);
    router.push({
      pathname: "/plans/unitLinked/sheet",
      query: { planId, sheetId },
    });
  }

  // Type B: hand off from the amount sheet to the installment sheet.
  function onNextButtonPress() {
    setIsPremiumSheetOpen(false);
    setIsInstalSheetOpen(true);
  }

  // Recompute on the debounced expected value; branch on planType (A → cal, B → amount).
  useEffect(() => {
    if (expectedInstal === "") return;
    if (planType === "A") submitCal(Number(expectedInstalDebounce));
    else if (planType === "B") submitAmount(Number(expectedInstalDebounce));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedInstalDebounce]);

  // Period options accommodate the entered age as a ceiling (maxAge >= age).
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
    planType,
    periodOptions,
    currencyOptions: planParam?.currencyOptions ?? [],
    currentInterestRateOptions: planParam?.currentInterestRateOptions ?? [],
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit: submitInfo,
    isSubmitting,
    isPremiumSheetOpen,
    setIsPremiumSheetOpen,
    isInstalSheetOpen,
    setIsInstalSheetOpen,
    expectedInstal,
    currency,
    amount,
    instal,
    isCalSubmitting,
    isAmountSubmitting,
    estimatedInstal,
    maxInstal,
    onExpectedInstalChange,
    onNextButtonPress,
    onGenerateSheetPress,
    onInstallSubmit: (value: number) => submitInstall(value),
    isInstallSubmitting,
  };
}
