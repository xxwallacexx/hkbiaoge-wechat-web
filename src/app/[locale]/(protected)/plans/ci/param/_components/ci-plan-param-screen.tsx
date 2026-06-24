"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanHeader } from "@/components/plan-header";
import { PlanIntroCard } from "@/components/plan-intro-card";
import { PlanPremiumCard } from "@/components/plan-premium-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCiPlanParam } from "@/hooks/use-ci-plan-param";

import { CiPlanParamForm } from "./ci-plan-param-form";

/**
 * The CI param screen (step 2/2): period/currency/health/area form, then a premium
 * bottom-sheet (debounced cal; no booster, no adjust). All state / data / mutations live in
 * `useCiPlanParam`; this component is presentation only.
 */
export function CiPlanParamScreen() {
  const t = useTranslations("CiPlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    planDetail,
    periodOptions,
    currencyOptions,
    healthOptions,
    areaOptions,
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit,
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
  } = useCiPlanParam();

  if (!planId || !sheetId) return null;

  if (showLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (isExpired || !planDetail) {
    return <ExpiredCard message={t("membershipExpired")} />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <PlanHeader
        title={t("inputPlanParams")}
        progress={{ current: 2, total: 2 }}
        onInfoPress={() => setIsInfoDialogOpen(true)}
        infoLabel={t("info")}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-xl rounded-xl border bg-muted/40 p-4 shadow-sm">
          <PlanIntroCard planDetail={planDetail} />
          <CiPlanParamForm
            periodOptions={periodOptions}
            currencyOptions={currencyOptions}
            healthOptions={healthOptions}
            areaOptions={areaOptions}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </div>
      </div>

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("info")}</DialogTitle>
            <DialogDescription>{planDetail.info}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <BottomSheet
        open={isPremiumSheetOpen}
        onClose={() => setIsPremiumSheetOpen(false)}
        title={t("inputPremium")}
      >
        <PlanPremiumCard
          expectedInstal={expectedInstal}
          currency={currency}
          amount={amount}
          instal={instal}
          isCalSubmitting={isCalSubmitting}
          onExpectedInstalChange={onExpectedInstalChange}
          onGenerateSheetPress={onGenerateSheetPress}
        />
      </BottomSheet>
    </main>
  );
}
