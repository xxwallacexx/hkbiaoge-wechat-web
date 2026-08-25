"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { SheetHeader } from "@/components/sheet-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSheetPdf } from "@/hooks/use-sheet-pdf";
import { useWholelifePlanSheet } from "@/hooks/use-wholelife-plan-sheet";
import { generateWholelifePlanSheetPdf } from "@/lib/api/wholelife-plans";

import { deathColumns } from "./death-columns";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { premiumColumns } from "./premium-columns";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The whole-life sheet: a header with the PDF download, two tabs (cash value / death
 * benefit) over the worksheet table, and a bottom bar with the summary button plus a
 * withdrawal button shown only when the plan's param has a `withdrawalCol`. No
 * discount/prepaid. All data/derivation lives in `useWholelifePlanSheet`; this is
 * presentation only.
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

  // Above the early returns below: hook order has to be identical on every render.
  const { onDownload, isGenerating } = useSheetPdf({
    generate: () => generateWholelifePlanSheetPdf(sheetId),
    errorMessage: t("pdfError"),
    // Optional-chained for the same reason this call sits up here: the loading gate is below.
    // The download button only renders once the sheet does, so these are filled in by the time
    // it can be tapped.
    meta: {
      customerName: basicInfo?.name,
      companyName: planDetail?.insuranceCompanyDetail.name,
      planName: planDetail?.name,
      sex: basicInfo?.sex,
      age: basicInfo?.age?.toString(),
      instal: cal?.instal,
      amount: cal?.amount,
      currency: sheetInfo?.currency,
      period: sheetInfo?.period,
      health: sheetInfo?.health,
      area: sheetInfo?.area,
    },
  });

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
      <SheetHeader
        title={planDetail.name}
        downloadLabel={t("downloadPdf")}
        busyLabel={t("pdfGenerating")}
        isBusy={isGenerating}
        onDownload={onDownload}
      />
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
