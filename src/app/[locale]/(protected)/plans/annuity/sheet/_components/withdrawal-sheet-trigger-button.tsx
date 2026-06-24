"use client";

import { CircleDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import type { WithdrawalData } from "@/types";

import { WithdrawalDetailSheet } from "./withdrawal-detail-sheet";

/** Bottom-bar button opening the withdrawal overview; pulses when any withdrawal is set. */
export function WithdrawalSheetTriggerButton({
  withdrawalDataJson = [],
}: {
  withdrawalDataJson: WithdrawalData[];
}) {
  const t = useTranslations("AnnuityPlan");
  const [open, setOpen] = useState(false);
  const totalWithdrawal = withdrawalDataJson
    .filter((d) => d.withdrawal > 0)
    .reduce((prev, cur) => prev + cur.withdrawal, 0);

  return (
    <>
      <Button
        variant="secondary"
        className="relative col-span-1"
        onClick={() => setOpen(true)}
      >
        <CircleDollarSign />
        {totalWithdrawal ? (
          <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-blue-500" />
        ) : null}
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("withdrawalOverview")}
      >
        <WithdrawalDetailSheet
          onClose={() => setOpen(false)}
          data={withdrawalDataJson}
        />
      </BottomSheet>
    </>
  );
}
