"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnnuityPlanSheet } from "@/hooks/use-annuity-plan-sheet";

import { AnnuityTriggerButton } from "./annuity-trigger-button";
import { columns } from "./columns";
import { CoupleAnnuityTriggerButton } from "./couple-annuity-trigger-button";
import { deathColumns } from "./death-columns";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { premiumColumns } from "./premium-columns";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The annuity sheet. Branches on `annuityPlanType` (mirrors the webview switch): GENERAL renders
 * one investment-style table plus a bottom bar with the single + couple annuity editors;
 * defered/immediate render the cash-value / death-benefit two-tab split with a floating annuity
 * editor (no couple annuity). All data/derivation lives in `useAnnuityPlanSheet`; this is
 * presentation only.
 */
export function AnnuityPlanSheetScreen() {
  const t = useTranslations("AnnuityPlan");
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
    premiumData,
    deathData,
    withdrawalData,
    isGeneral,
  } = useAnnuityPlanSheet();

  if (!planId || !sheetId) return null;

  if (showLoading || !isSheetReady || !basicInfo || !sheetInfo) {
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

  // Annuity-age options valid for the chosen term and insured age (the annuity-info select).
  const filteredAnnuityAgeOptions = planParam.annuityAgeOptions.filter(
    (option) =>
      option.period === sheetInfo.period &&
      basicInfo.age >= option.minAge &&
      basicInfo.age <= option.maxAge,
  );

  if (isGeneral) {
    return (
      <main className="relative h-screen bg-background">
        <Tabs defaultValue="premium" className="w-full">
          <TabsContent value="premium">
            <PlanDataTable
              headers={planParam.headers ?? []}
              columns={columns}
              data={tableData}
            />
          </TabsContent>

          <div className="absolute bottom-0 z-10 grid w-full grid-cols-6 items-center justify-center gap-2 border-t-[0.5px] border-slate-300 bg-white p-2 shadow-xl">
            <PlanSummarySheetTriggerButton
              planDetail={planDetail}
              basicInfo={basicInfo}
              sheetInfo={sheetInfo}
              cal={cal}
              isGeneral={isGeneral}
            />
            <AnnuityTriggerButton
              isAnnuityAgeFreeInput={planParam.isAnnuityAgeFreeInput}
              annuityAgeOptions={filteredAnnuityAgeOptions}
              annuityConstraint={planParam.annuityConstraint}
              annuityTypeOptions={planParam.annuityTypeOptions}
              isGeneral={isGeneral}
            />
            <CoupleAnnuityTriggerButton
              annuityConstraint={planParam.annuityConstraint}
              coupleAnnuityTypeOptions={planParam.coupleAnnuityTypeOptions}
            />
            <WithdrawalSheetTriggerButton withdrawalDataJson={withdrawalData} />
          </div>
        </Tabs>
      </main>
    );
  }

  return (
    <main className="relative h-screen bg-background">
      <Tabs defaultValue="premium" className="w-full">
        <TabsContent value="premium">
          <PlanDataTable
            headers={planParam.premiumHeaders ?? []}
            columns={premiumColumns}
            data={premiumData}
          />
        </TabsContent>
        <TabsContent value="death">
          <PlanDataTable
            headers={planParam.deathHeaders ?? []}
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
            isGeneral={isGeneral}
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

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <AnnuityTriggerButton
            isAnnuityAgeFreeInput={planParam.isAnnuityAgeFreeInput}
            annuityAgeOptions={filteredAnnuityAgeOptions}
            annuityConstraint={planParam.annuityConstraint}
            annuityTypeOptions={planParam.annuityTypeOptions}
            payoutPeriodOptions={planParam.payoutPeriodOptions ?? []}
            isGeneral={isGeneral}
          />
        </div>
      </Tabs>
    </main>
  );
}
