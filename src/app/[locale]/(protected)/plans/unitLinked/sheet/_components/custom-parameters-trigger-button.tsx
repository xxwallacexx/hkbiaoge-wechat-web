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
  getUnitLinkedPlanSheetCustomParameters,
  updateUnitLinkedPlanSheetCustomParameters,
} from "@/lib/api/unit-linked-plans";

import { SheetCustomParameterForm } from "./sheet-custom-parameter-form";

function InfoData({
  isLoading,
  onClick,
  name,
  value,
}: {
  isLoading: boolean;
  onClick: () => void;
  name: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-1 content-center border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {name}
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
 * Type-B-only editor for the plan's custom parameters (each a named percentage mapped to a
 * spreadsheet cell). Tapping a parameter opens a form to edit it; saving writes the full
 * values array back and invalidates the sheet.
 */
export function CustomParametersTriggerButton({
  customParameters = [],
}: {
  customParameters?: { name: string; cell: string }[];
}) {
  const t = useTranslations("UnitLinkedPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();

  const [isListOpen, setIsListOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: values = [], isFetching } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "customParameters"],
    enabled: !!sheetId,
    queryFn: () => getUnitLinkedPlanSheetCustomParameters(sheetId),
  });

  const { mutate: onSubmit, isPending: isLoading } = useMutation({
    mutationFn: ({ value }: { value: number }) => {
      const next = values.map((v) => parseFloat(v));
      next[selectedIndex] = value;
      return updateUnitLinkedPlanSheetCustomParameters({
        sheetId,
        values: next,
      });
    },
    onSuccess: () => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["unitLinkedPlanSheet", sheetId],
      });
    },
    onError: () => toast.error(t("customParametersError")),
  });

  return (
    <>
      <Button className="h-10 w-20" onClick={() => setIsListOpen(true)}>
        {t("customParameters")}
      </Button>
      <BottomSheet
        open={isListOpen}
        onClose={() => setIsListOpen(false)}
        title={t("customParameters")}
      >
        <div className="space-y-4 rounded-[22px] border bg-white p-4">
          {customParameters.map((param, index) => (
            <InfoData
              key={param.cell}
              isLoading={isFetching}
              name={param.name}
              value={values[index]}
              onClick={() => {
                setSelectedIndex(index);
                setIsEditOpen(true);
              }}
            />
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <SheetCustomParameterForm
          name={customParameters[selectedIndex]?.name ?? ""}
          defaultValue={parseFloat(values[selectedIndex] ?? "0")}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </BottomSheet>
    </>
  );
}
