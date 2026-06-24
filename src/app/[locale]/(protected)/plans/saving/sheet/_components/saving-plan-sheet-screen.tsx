"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavingPlanSheet } from "@/hooks/use-saving-plan-sheet";

import { deathColumns } from "./death-columns";
import { DiscountTriggerButton } from "./discount-trigger-button";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { premiumColumns } from "./premium-columns";
import { PrepaidTriggerButton } from "./prepaid-trigger-button";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The saving-plan sheet: two tabs (cash value / death benefit) over the worksheet table,
 * a bottom bar with the summary + withdrawal buttons, and conditional discount/prepaid
 * editors. All data/derivation lives in `useSavingPlanSheet`; this is presentation only.
 */
export function SavingPlanSheetScreen() {
  const t = useTranslations("SavingPlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    isSheetReady,
    planDetail,
    planParam,
    personalInfo,
    cal,
    premiumData,
    deathData,
    withdrawalData,
  } = useSavingPlanSheet();

  if (!planId || !sheetId) return null;

  if (showLoading || !isSheetReady || !personalInfo || !cal) {
    if (isExpired || !planDetail || !planParam) {
      return <ExpiredCard message={t("membershipExpired")} />;
    }
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (isExpired || !planDetail || !planParam) {
    return <ExpiredCard message={t("membershipExpired")} />;
  }

  return (
    <main className="relative h-screen bg-background">
      <Tabs defaultValue="premium" className="w-full">
        <TabsContent value="premium">
          <PlanDataTable
            headers={planParam.premiumHeaders}
            columns={premiumColumns}
            data={premiumData}
          />
        </TabsContent>
        <TabsContent value="death">
          <PlanDataTable
            headers={planParam.deathHeaders}
            columns={deathColumns}
            data={deathData}
          />
        </TabsContent>

        <div className="absolute bottom-0 z-10 grid w-full grid-cols-5 items-center justify-center gap-2 border-t-[0.5px] border-slate-300 bg-white p-2 shadow-xl">
          <PlanSummarySheetTriggerButton
            planDetail={planDetail}
            personalInfo={personalInfo}
            cal={cal}
          />
          <TabsList className="col-span-3 grid w-full grid-cols-2">
            <TabsTrigger
              value="premium"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              {t("cashValue")}
            </TabsTrigger>
            <TabsTrigger
              value="death"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              {t("deathBenefit")}
            </TabsTrigger>
          </TabsList>
          <WithdrawalSheetTriggerButton withdrawalDataJson={withdrawalData} />
        </div>
      </Tabs>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 space-x-2">
        {planParam.discountRange ? <DiscountTriggerButton /> : null}
        {planParam.prepaidRange && planParam.prepaidCell ? (
          <PrepaidTriggerButton
            prepaidCell={planParam.prepaidCell}
            prepaidOptions={planParam.prepaidOptions}
          />
        ) : null}
      </div>
    </main>
  );
}
