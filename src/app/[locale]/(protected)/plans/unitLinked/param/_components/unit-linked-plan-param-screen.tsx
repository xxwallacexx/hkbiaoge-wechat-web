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
import { useUnitLinkedPlanParam } from "@/hooks/use-unit-linked-plan-param";

import { UnitLinkedPlanBAmountCard } from "./unit-linked-plan-b-amount-card";
import { UnitLinkedPlanBInstalCard } from "./unit-linked-plan-b-instal-card";
import { UnitLinkedPlanParamForm } from "./unit-linked-plan-param-form";

/**
 * The unit-linked param screen (step 2/2): period/currency/currentInterestRate form, then a
 * premium bottom-sheet that branches on `planType` — A reuses the shared `PlanPremiumCard`
 * (single debounced cal); B uses an insured-amount card (premium range) handing off to a
 * second installment sheet. All state / data live in `useUnitLinkedPlanParam`; presentation
 * only.
 */
export function UnitLinkedPlanParamScreen() {
  const t = useTranslations("UnitLinkedPlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    planDetail,
    planType,
    periodOptions,
    currencyOptions,
    currentInterestRateOptions,
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit,
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
    onInstallSubmit,
    isInstallSubmitting,
  } = useUnitLinkedPlanParam();

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
          <UnitLinkedPlanParamForm
            periodOptions={periodOptions}
            currencyOptions={currencyOptions}
            currentInterestRateOptions={currentInterestRateOptions}
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

      {/* Premium sheet (step 1): type A = the shared cal card, type B = the amount card. */}
      <BottomSheet
        open={isPremiumSheetOpen}
        onClose={() => setIsPremiumSheetOpen(false)}
        title={planType === "B" ? t("inputInsuredAmount") : t("inputPremium")}
      >
        {planType === "A" ? (
          <PlanPremiumCard
            expectedInstal={expectedInstal}
            currency={currency}
            amount={amount}
            instal={instal}
            isCalSubmitting={isCalSubmitting}
            onExpectedInstalChange={onExpectedInstalChange}
            onGenerateSheetPress={onGenerateSheetPress}
          />
        ) : (
          <UnitLinkedPlanBAmountCard
            expectedAmount={expectedInstal}
            currency={currency}
            amount={amount}
            isAmountSubmitting={isAmountSubmitting}
            onExpectedAmountChange={onExpectedInstalChange}
            onNextButtonPress={onNextButtonPress}
            estimatedInstal={estimatedInstal}
            maxInstal={maxInstal}
          />
        )}
      </BottomSheet>

      {/* Installment sheet (step 2, type B only): pick an installment within the range. */}
      <BottomSheet
        open={isInstalSheetOpen}
        onClose={() => setIsInstalSheetOpen(false)}
        title={t("inputPremium")}
      >
        {estimatedInstal !== undefined && maxInstal !== undefined && (
          <UnitLinkedPlanBInstalCard
            currency={currency}
            minInstal={estimatedInstal}
            maxInstal={maxInstal}
            isSubmitting={isInstallSubmitting}
            onSubmit={onInstallSubmit}
          />
        )}
      </BottomSheet>
    </main>
  );
}
