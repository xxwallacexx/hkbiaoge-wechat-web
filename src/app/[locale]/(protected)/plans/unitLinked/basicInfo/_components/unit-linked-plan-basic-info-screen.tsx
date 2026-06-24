"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanHeader } from "@/components/plan-header";
import { PlanIntroCard } from "@/components/plan-intro-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUnitLinkedPlanBasicInfo } from "@/hooks/use-unit-linked-plan-basic-info";

import { UnitLinkedPlanBasicInfoForm } from "./unit-linked-plan-basic-info-form";

/**
 * The unit-linked basic-info screen (step 1/2): a gradient header with a progress indicator
 * and info dialog, the plan-intro card, and the name/sex/age form. All state / data live in
 * `useUnitLinkedPlanBasicInfo`; this component is presentation only.
 */
export function UnitLinkedPlanBasicInfoScreen() {
  const t = useTranslations("UnitLinkedPlan");
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
  } = useUnitLinkedPlanBasicInfo();

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
        title={t("inputBasicInfo")}
        progress={{ current: 1, total: 2 }}
        onInfoPress={() => setIsInfoDialogOpen(true)}
        infoLabel={t("info")}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-xl rounded-xl border bg-muted/40 p-4 shadow-sm">
          <PlanIntroCard planDetail={planDetail} />
          <UnitLinkedPlanBasicInfoForm
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
