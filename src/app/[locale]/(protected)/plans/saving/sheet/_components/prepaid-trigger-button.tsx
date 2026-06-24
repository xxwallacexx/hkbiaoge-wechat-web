"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSavingPlanSheetPrepaid,
  getSavingPlanSheetPrepaidStatus,
  updateSavingPlanSheetPrepaid,
  updateSavingPlanSheetPrepaidStatus,
} from "@/lib/api/saving-plans";

import { SheetPrepaidForm } from "./sheet-prepaid-form";

// Backend literal returned by /prepaidStatus when prepay is off — compared, never localized.
const PREPAID_DISABLED = "不預交";

function InfoData({
  isLoading,
  onClick,
  label,
  disabled,
  value,
}: {
  isLoading: boolean;
  onClick: () => void;
  label: string;
  disabled: boolean;
  value?: string;
}) {
  const t = useTranslations("SavingPlan");
  return (
    <div className="grid grid-cols-5 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-2 content-center border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {label}
      </div>
      <div className="col-span-3 px-2 py-1 text-sm text-neutral-600">
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <Button
            variant={disabled ? "ghost" : "default"}
            disabled={disabled}
            size="sm"
            onClick={onClick}
          >
            {disabled ? t("notApplicable") : value}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Prepaid editor. Loads the per-year prepaid array (renders nothing if empty) plus the
 * "是否預交" status; when status is `不預交` the per-year rows are disabled. Edits and the
 * status change both write back and invalidate the sheet.
 */
export function PrepaidTriggerButton({
  prepaidCell,
  prepaidOptions = [],
}: {
  prepaidCell?: string;
  prepaidOptions?: string[];
}) {
  const t = useTranslations("SavingPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["savingPlanSheet", sheetId] });

  // These queries only run after the screen reaches `isSheetReady` (auth settled, cookie
  // present), so gating on `!!sheetId` alone is sufficient — no `useAuthToken` needed here.
  const { data: prepaid = [], isFetching } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "prepaid"],
    enabled: !!sheetId,
    queryFn: () => getSavingPlanSheetPrepaid(sheetId),
  });

  const { data: prepaidStatus, isFetching: isStatusFetching } = useQuery({
    queryKey: ["savingPlanSheet", sheetId, "prepaidStatus"],
    enabled: !!sheetId,
    queryFn: () => getSavingPlanSheetPrepaidStatus(sheetId),
  });

  const { mutate: onSubmit, isPending: isLoading } = useMutation({
    mutationFn: ({ value }: { value: number }) => {
      const values = prepaid.map((v) => parseFloat(v));
      values[selectedIndex] = value;
      return updateSavingPlanSheetPrepaid({ sheetId, values });
    },
    onSuccess: () => {
      setIsEditOpen(false);
      invalidate();
    },
    onError: () => toast.error(t("prepaidError")),
  });

  const { mutate: onStatusChange, isPending: isStatusLoading } = useMutation({
    mutationFn: (value: string) =>
      updateSavingPlanSheetPrepaidStatus({ sheetId, value }),
    onSuccess: () => invalidate(),
    onError: () => toast.error(t("prepaidError")),
  });

  if (!prepaid.length) return null;

  const disabled = prepaidStatus === PREPAID_DISABLED;

  return (
    <>
      <Button
        className="col-span-2 h-10 w-20"
        onClick={() => setIsListOpen(true)}
      >
        {t("prepaidRate")}
      </Button>
      <BottomSheet
        open={isListOpen}
        onClose={() => setIsListOpen(false)}
        title={t("prepaidRate")}
      >
        {prepaidCell ? (
          <div className="mb-4">
            {isStatusFetching || isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                defaultValue={prepaidStatus}
                onValueChange={(value) => onStatusChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("prepaidSelectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {prepaidOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : null}
        <div className="space-y-4 rounded-[22px] border bg-white p-4">
          {prepaid.map((value, index) => (
            <InfoData
              key={index.toString()}
              isLoading={isFetching || isStatusLoading}
              label={t("prepaidYearLabel", { index: index + 1 })}
              value={value}
              disabled={disabled}
              onClick={() => {
                setSelectedIndex(index);
                setIsEditOpen(true);
              }}
            />
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <SheetPrepaidForm
          index={selectedIndex + 1}
          defaultValue={parseFloat(prepaid[selectedIndex])}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </BottomSheet>
    </>
  );
}
