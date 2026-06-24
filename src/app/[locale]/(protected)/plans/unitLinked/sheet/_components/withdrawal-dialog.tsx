"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { WithdrawalForm } from "./withdrawal-form";

/**
 * The per-row "現金提取" cell: a button showing the current withdrawal that opens a dialog to
 * edit it. The trigger ref is handed to the form so it can close the dialog on success.
 */
export function WithdrawalDialog({
  value,
  period,
  startRow,
  maxWithdrawalPeriod,
}: {
  value: string;
  period: string;
  startRow: number;
  maxWithdrawalPeriod: number;
}) {
  const t = useTranslations("UnitLinkedPlan");
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog>
      <DialogTrigger ref={closeRef} className="w-full justify-end" asChild>
        <Button variant="secondary">{value}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("updateWithdrawalTitle", { period })}</DialogTitle>
        </DialogHeader>
        <WithdrawalForm
          closeRef={closeRef}
          startRow={startRow}
          maxWithdrawalPeriod={maxWithdrawalPeriod}
          defaultValue={Number(value.replaceAll(",", ""))}
        />
      </DialogContent>
    </Dialog>
  );
}
