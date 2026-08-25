"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { ExpiredCard } from "@/components/expired-card";
import { PlanDataTable } from "@/components/plan-data-table";
import { SheetHeader } from "@/components/sheet-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSheetPdf } from "@/hooks/use-sheet-pdf";
import { useUnitLinkedPlanSheet } from "@/hooks/use-unit-linked-plan-sheet";
import { generateUnitLinkedPlanSheetPdf } from "@/lib/api/unit-linked-plans";
import { cn } from "@/lib/utils";

import { columns } from "./columns";
import { CustomParametersTriggerButton } from "./custom-parameters-trigger-button";
import { HealthAreaSheetTriggerButton } from "./health-area-sheet-trigger-button";
import { PlanSummarySheetTriggerButton } from "./plan-summary-sheet-trigger-button";
import { UnitLinkedAnnuityTriggerButton } from "./unit-linked-annuity-trigger-button";
import { UnitLinkedCoupleAnnuityTriggerButton } from "./unit-linked-couple-annuity-trigger-button";
import { WithdrawalSheetTriggerButton } from "./withdrawal-sheet-trigger-button";

/**
 * The unit-linked sheet: a header with the PDF download over a single worksheet table (no
 * premium/death split — 身故 is in-table) and a bottom bar with the summary + withdrawal
 * buttons, plus optional editors gated by data presence — a type-B/D inline health/area
 * editor + floating custom-parameters editor, and the type-C single + couple annuity
 * editors. `extraButtonCount` shrinks the tab list's col-span as those editors appear. All
 * data/derivation lives in `useUnitLinkedPlanSheet`; presentation only.
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
    canEditCustomParameters,
    hasHealthArea,
    extraButtonCount,
    area,
    health,
    annuityInfo,
    coupleAnnuityInfo,
  } = useUnitLinkedPlanSheet();

  // Above the early returns below: hook order has to be identical on every render.
  const { onDownload, isGenerating } = useSheetPdf({
    generate: () => generateUnitLinkedPlanSheetPdf(sheetId),
    errorMessage: t("pdfError"),
    // Optional-chained for the same reason this call sits up here: the loading gate is below.
    // The download button only renders once the sheet does, so these are filled in by the time
    // it can be tapped.
    //
    // 地區 / 健康標準 are type-B/D and the annuity pair is type-C, so a given sheet fills one
    // group or the other and never both — the hook returns undefined for whichever the plan
    // has no editor for, and those params are simply absent.
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
      health,
      area,
      currentInterestRate: sheetInfo?.currentInterestRate,
      annuityAge: annuityInfo?.annuityAge?.toString(),
      annuityOption: annuityInfo?.annuityOption,
      coupleAnnuityAge: coupleAnnuityInfo?.coupleAnnuityAge?.toString(),
      coupleAnnuityOption: coupleAnnuityInfo?.coupleAnnuityOption,
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
            headers={planParam.headers}
            columns={columns}
            data={tableData}
          />
        </TabsContent>

        {/*
          Bottom bar: always 5 columns. Summary + withdrawal are fixed (1 each), the tab list
          shrinks (3/2/1) as extras appear, and each extra editor is 1 col — so the row always
          sums to 5. This holds because `extraButtonCount` ≤ 2: health/area is type-B/D-only and
          the annuity editors are type-C-only (mutually exclusive by backend data).
        */}
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
              extraButtonCount === 0 && "col-span-3",
              extraButtonCount === 1 && "col-span-2",
              extraButtonCount >= 2 && "col-span-1",
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
          {planParam.annuityRange &&
          planParam.annuityTypeOptions &&
          planParam.annuityConstraint ? (
            <UnitLinkedAnnuityTriggerButton
              annuityConstraint={planParam.annuityConstraint}
              annuityTypeOptions={planParam.annuityTypeOptions}
            />
          ) : null}
          {planParam.coupleAnnuityRange &&
          planParam.coupleAnnuityTypeOptions &&
          planParam.annuityConstraint ? (
            <UnitLinkedCoupleAnnuityTriggerButton
              annuityConstraint={planParam.annuityConstraint}
              coupleAnnuityTypeOptions={planParam.coupleAnnuityTypeOptions}
            />
          ) : null}
          <WithdrawalSheetTriggerButton withdrawalDataJson={withdrawalData} />
        </div>
      </Tabs>

      {canEditCustomParameters && planParam.customParameters ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <CustomParametersTriggerButton
            customParameters={planParam.customParameters}
          />
        </div>
      ) : null}
    </main>
  );
}
