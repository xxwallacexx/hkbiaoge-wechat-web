"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
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
  getUnitLinkedPlanSheetArea,
  getUnitLinkedPlanSheetHealth,
  updateUnitLinkedPlanSheetArea,
  updateUnitLinkedPlanSheetHealth,
} from "@/lib/api/unit-linked-plans";

/**
 * Type-B-only inline editor for the sheet's 地區 (area) + 健康標準 (health) selections.
 * Changing a Select immediately PUTs and invalidates the sheet so the table re-derives.
 */
export function HealthAreaSheetTriggerButton({
  areaOptions = [],
  healthOptions = [],
}: {
  areaOptions?: string[];
  healthOptions?: string[];
}) {
  const t = useTranslations("UnitLinkedPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["unitLinkedPlanSheet", sheetId],
    });

  const { data: area, isFetching: isAreaFetching } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "area"],
    enabled: !!sheetId,
    queryFn: () => getUnitLinkedPlanSheetArea(sheetId),
  });

  const { data: health, isFetching: isHealthFetching } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "health"],
    enabled: !!sheetId,
    queryFn: () => getUnitLinkedPlanSheetHealth(sheetId),
  });

  const { mutate: onAreaChange } = useMutation({
    mutationFn: (value: string) =>
      updateUnitLinkedPlanSheetArea({ sheetId, value }),
    onSuccess: invalidate,
    onError: () => toast.error(t("healthAreaError")),
  });

  const { mutate: onHealthChange } = useMutation({
    mutationFn: (value: string) =>
      updateUnitLinkedPlanSheetHealth({ sheetId, value }),
    onSuccess: invalidate,
    onError: () => toast.error(t("healthAreaError")),
  });

  return (
    <>
      <Button
        variant="secondary"
        className="relative col-span-1"
        onClick={() => setOpen(true)}
      >
        <Globe />
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("healthAreaTitle")}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-5 items-center gap-2">
            <div className="col-span-1 text-sm text-black">{t("region")}</div>
            <div className="col-span-4">
              {isAreaFetching ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  defaultValue={area}
                  onValueChange={(value) => onAreaChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("region")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {areaOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-5 items-center gap-2">
            <div className="col-span-1 text-sm text-black">
              {t("healthStandard")}
            </div>
            <div className="col-span-4">
              {isHealthFetching ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  defaultValue={health}
                  onValueChange={(value) => onHealthChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("healthStandard")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {healthOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
