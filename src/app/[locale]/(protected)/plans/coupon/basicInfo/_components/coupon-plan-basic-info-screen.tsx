"use client";

import { ChevronLeft, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanIntroCard } from "@/components/plan-intro-card";
import { ProgressIndicator } from "@/components/progress-indicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCouponPlanBasicInfo } from "@/hooks/use-coupon-plan-basic-info";

import { CouponPlanBasicInfoForm } from "./coupon-plan-basic-info-form";

/**
 * The coupon basic-info screen (step 1/2): a gradient header with a progress indicator
 * and info dialog, the plan-intro card, and the name/sex/age form. All state / data live
 * in `useCouponPlanBasicInfo`; this component is presentation only.
 */
export function CouponPlanBasicInfoScreen() {
  const t = useTranslations("CouponPlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    planDetail,
    minAge,
    maxAge,
    isInfoDialogOpen,
    setIsInfoDialogOpen,
    onSubmit,
    isSubmitting,
    goBack,
  } = useCouponPlanBasicInfo();

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
      <div className="relative flex flex-col items-center gap-3 rounded-b-3xl bg-gradient-to-b from-primary to-primary/90 px-4 pb-8 pt-6 text-primary-foreground">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("back")}
          className="absolute left-4 top-6 rounded-full p-1.5 hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setIsInfoDialogOpen(true)}
          aria-label={t("info")}
          className="absolute right-4 top-6 rounded-full border border-white/60 p-1.5 hover:bg-white/10"
        >
          <Info className="h-5 w-5" />
        </button>
        <ProgressIndicator current={1} total={2} />
        <h1 className="text-xl font-bold md:text-2xl">{t("inputBasicInfo")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-xl rounded-xl border bg-muted/40 p-4 shadow-sm">
          <PlanIntroCard planDetail={planDetail} />
          <CouponPlanBasicInfoForm
            minAge={minAge}
            maxAge={maxAge}
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
    </main>
  );
}
