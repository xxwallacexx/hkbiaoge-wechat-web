"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWholelifePlanSheet } from "@/hooks/use-wholelife-plan-sheet";

import { deathColumns } from "./death-columns";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { premiumColumns } from "./premium-columns";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The whole-life sheet: two tabs (cash value / death benefit) over the worksheet table and a
 * bottom bar with the summary button plus a withdrawal button shown only when the plan's
 * param has a `withdrawalCol`. No discount/prepaid. All data/derivation lives in
 * `useWholelifePlanSheet`; this is presentation only.
 */
export function WholelifePlanSheetScreen() {
  const t = useTranslations("WholelifePlan");
  const {
    planId,
    sheetId,
    showLoading,
    isExpired,
    isSheetReady,
    planDetail,
    planParam,
    basicInfo,
    sheetInfo,
    cal,
    premiumData,
    deathData,
    withdrawalData,
  } = useWholelifePlanSheet();

  if (!planId || !sheetId) return null;

  if (showLoading || !isSheetReady || !basicInfo || !sheetInfo || !cal) {
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
            basicInfo={basicInfo}
            sheetInfo={sheetInfo}
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
          {planParam.withdrawalCol ? (
            <WithdrawalSheetTriggerButton withdrawalDataJson={withdrawalData} />
          ) : null}
        </div>
      </Tabs>
    </main>
  );
}
