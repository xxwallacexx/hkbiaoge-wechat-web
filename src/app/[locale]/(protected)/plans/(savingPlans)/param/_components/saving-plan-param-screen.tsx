"use client";

import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSavingPlanParam } from "@/hooks/use-saving-plan-param";

import { ExpiredCard } from "./expired-card";
import { PlanIntroCard } from "./plan-intro-card";
import { PlanPremiumCard } from "./plan-premium-card";
import { SavingPlanParamForm } from "./saving-plan-param-form";

/**
 * The saving-plan param screen: a header with an info dialog, the plan-intro card + param
 * form, and a premium bottom sheet. All state / data / mutations live in
 * `useSavingPlanParam`; this component is presentation only.
 */
export function SavingPlanParamScreen() {
  const t = useTranslations("SavingPlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    planDetail,
    planParam,
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
    isExpectedInstalError,
    isCalSubmitting,
    onExpectedInstalChange,
    isAdjustSubmitting,
    onAdjustSubmit,
    onGenerateSheetPress,
    isBoosterAvailable,
    isBoosterApplied,
    onBoosterPress,
    beforeBooster,
    afterBooster,
    goBack,
  } = useSavingPlanParam();

  if (!planId || !sheetId) return null;

  if (showLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (isExpired || !planDetail || !planParam) {
    return <ExpiredCard />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="relative flex items-center justify-center rounded-b-3xl bg-gradient-to-b from-primary to-primary/90 px-4 pb-8 pt-6 text-primary-foreground">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("back")}
          className="absolute left-4 rounded-full p-1.5 hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold md:text-2xl">
          {t("inputPlanParams")}
        </h1>
        <button
          type="button"
          onClick={() => setIsInfoDialogOpen(true)}
          aria-label={t("info")}
          className="absolute right-4 rounded-full border border-white/60 p-1.5 hover:bg-white/10"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-xl rounded-xl border bg-muted/40 p-4 shadow-sm">
          <PlanIntroCard planDetail={planDetail} />
          <SavingPlanParamForm
            periodOptions={planParam.periodOptions}
            currencyOptions={planParam.currencyOptions}
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
          isExpectedInstalError={isExpectedInstalError}
          isCalSubmitting={isCalSubmitting}
          onExpectedInstalChange={onExpectedInstalChange}
          isAdjustSubmitting={isAdjustSubmitting}
          onAdjustSubmit={onAdjustSubmit}
          onGenerateSheetPress={onGenerateSheetPress}
          isBoosterAvailable={isBoosterAvailable}
          isBoosterApplied={isBoosterApplied}
          onBoosterPress={onBoosterPress}
          beforeBooster={beforeBooster}
          afterBooster={afterBooster}
        />
      </BottomSheet>
    </main>
  );
}
