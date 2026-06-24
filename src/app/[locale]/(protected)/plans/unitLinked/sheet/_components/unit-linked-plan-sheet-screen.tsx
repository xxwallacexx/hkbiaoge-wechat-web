"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnitLinkedPlanSheet } from "@/hooks/use-unit-linked-plan-sheet";
import { cn } from "@/lib/utils";

import { columns } from "./columns";
import { CustomParametersTriggerButton } from "./custom-parameters-trigger-button";
import { HealthAreaSheetTriggerButton } from "./health-area-sheet-trigger-button";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The unit-linked sheet: a single worksheet table (no premium/death split — 身故 is in-table)
 * and a bottom bar with the summary + withdrawal buttons, plus (type B only) an inline
 * health/area editor and a floating custom-parameters editor. All data/derivation lives in
 * `useUnitLinkedPlanSheet`; this is presentation only.
 */
export function UnitLinkedPlanSheetScreen() {
  const t = useTranslations("UnitLinkedPlan");
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
    tableData,
    withdrawalData,
    isTypeB,
    hasHealthArea,
  } = useUnitLinkedPlanSheet();

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
            headers={planParam.headers}
            columns={columns}
            data={tableData}
          />
        </TabsContent>

        <div className="absolute bottom-0 z-10 grid w-full grid-cols-5 items-center justify-center gap-2 border-t-[0.5px] border-slate-300 bg-white p-2 shadow-xl">
          <PlanSummarySheetTriggerButton
            planDetail={planDetail}
            basicInfo={basicInfo}
            sheetInfo={sheetInfo}
            cal={cal}
          />
          <TabsList
            className={cn(
              "grid w-full grid-cols-1",
              hasHealthArea ? "col-span-2" : "col-span-3",
            )}
          >
            <TabsTrigger
              value="premium"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              {t("cashValue")}
            </TabsTrigger>
          </TabsList>
          {hasHealthArea ? (
            <HealthAreaSheetTriggerButton
              areaOptions={planParam.areaOptions}
              healthOptions={planParam.healthOptions}
            />
          ) : null}
          <WithdrawalSheetTriggerButton withdrawalDataJson={withdrawalData} />
        </div>
      </Tabs>

      {isTypeB && planParam.customParameters ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <CustomParametersTriggerButton
            customParameters={planParam.customParameters}
          />
        </div>
      ) : null}
    </main>
  );
}
