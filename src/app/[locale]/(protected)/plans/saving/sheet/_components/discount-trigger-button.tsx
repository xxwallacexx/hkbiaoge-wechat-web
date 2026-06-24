"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSavingPlanSheetDiscount,
  updateSavingPlanSheetDiscount,
} from "@/lib/api/saving-plans";

import { SheetDiscountForm } from "./sheet-discount-form";

function InfoData({
  isLoading,
  onClick,
  label,
  value,
}: {
  isLoading: boolean;
  onClick: () => void;
  label: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-1 content-center border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {label}
      </div>
      <div className="col-span-2 px-2 py-1 text-sm text-neutral-600">
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <Button size="sm" onClick={onClick}>
            {value}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Discount editor. Loads the per-year discount array and renders nothing if empty (matches
 * webview). Tapping a year opens a form to edit it; saving writes the full array back and
 * invalidates the sheet.
 */
export function DiscountTriggerButton() {
  const t = useTranslations("SavingPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // This button only mounts after the screen reaches `isSheetReady` (auth settled, cookie
  // present), so gating on `!!sheetId` alone is sufficient — no `useAuthToken` needed here.
  const { data: discount = [], isFetching } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "discount"],
    enabled: !!sheetId,
    queryFn: () => getSavingPlanSheetDiscount(sheetId),
  });

  const { mutate: onSubmit, isPending: isLoading } = useMutation({
    mutationFn: ({ value }: { value: number }) => {
      const values = discount.map((v) => parseFloat(v));
      values[selectedIndex] = value;
      return updateSavingPlanSheetDiscount({ sheetId, values });
    },
    onSuccess: () => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["savingPlanSheet", sheetId],
      });
    },
    onError: () => toast.error(t("discountError")),
  });

  if (!discount.length) return null;

  return (
    <>
      <Button
        className="col-span-2 h-10 w-20"
        onClick={() => setIsListOpen(true)}
      >
        {t("discount")}
      </Button>
      <BottomSheet
        open={isListOpen}
        onClose={() => setIsListOpen(false)}
        title={t("discount")}
      >
        <div className="space-y-4 rounded-[22px] border bg-white p-4">
          {discount.map((value, index) => (
            <InfoData
              key={index.toString()}
              isLoading={isFetching}
              label={t("discountYearLabel", { index: index + 1 })}
              value={value}
              onClick={() => {
                setSelectedIndex(index);
                setIsEditOpen(true);
              }}
            />
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <SheetDiscountForm
          index={selectedIndex + 1}
          defaultValue={parseFloat(discount[selectedIndex])}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </BottomSheet>
    </>
  );
}
