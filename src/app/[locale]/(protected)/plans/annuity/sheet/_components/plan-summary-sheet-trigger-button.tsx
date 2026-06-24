"use client";

import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { MovingButton } from "@/components/ui/moving-button";
import type {
  AnnuityPlanSheetBasicInfo,
  AnnuitySheetInfo,
  PlanCal,
  PlanDetail,
} from "@/types";

function Data({ field, value }: { field: string; value: string }) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-1 border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {field}
      </div>
      <div className="col-span-3 px-2 py-1 text-sm text-neutral-600">
        {value}
      </div>
    </div>
  );
}

/**
 * Bottom-bar button opening a read-only summary: company badge, plan name, and the client's
 * age / term. GENERAL shows the entered investment amount + currency; defered/immediate show
 * the premium (currency + installment from `cal`).
 */
export function PlanSummarySheetTriggerButton({
  planDetail,
  basicInfo,
  sheetInfo,
  cal,
  isGeneral,
}: {
  planDetail: PlanDetail;
  basicInfo: AnnuityPlanSheetBasicInfo;
  sheetInfo: AnnuitySheetInfo;
  cal?: PlanCal;
  isGeneral: boolean;
}) {
  const t = useTranslations("AnnuityPlan");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        className="relative col-span-1"
        onClick={() => setOpen(true)}
      >
        <ClipboardList />
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("planOverview")}
      >
        <div className="space-y-4">
          <div className="grid max-w-lg grid-cols-4 items-center gap-4">
            <p
              className="col-span-1 line-clamp-1 rounded-sm p-1 text-center text-white"
              style={{ background: planDetail.insuranceCompanyDetail.bg }}
            >
              {planDetail.insuranceCompanyDetail.name}
            </p>
            <div className="col-span-3">
              <MovingButton
                borderRadius="1.75rem"
                className="border-neutral-200 bg-white text-black"
              >
                {planDetail.name}
              </MovingButton>
            </div>
          </div>
          <div className="rounded-[22px] border bg-white p-4 sm:p-10">
            <p className="mb-2 mt-4 text-base text-black sm:text-xl">
              {basicInfo.name}
            </p>
            <div className="space-y-4">
              <Data field={t("age")} value={basicInfo.age.toString()} />
              <Data field={t("period")} value={sheetInfo.period} />
              {isGeneral ? (
                <>
                  <Data
                    field={t("investmentAmount")}
                    value={sheetInfo.amount ?? ""}
                  />
                  <Data field={t("currency")} value={sheetInfo.currency} />
                </>
              ) : (
                <Data
                  field={t("premium")}
                  value={`${sheetInfo.currency} ${cal?.instal ?? ""}`}
                />
              )}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
