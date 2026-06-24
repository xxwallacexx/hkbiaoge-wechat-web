"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getAnnuityDisplayType,
  getAnnuityInfo,
  getAnnuityPayoutPeriod,
  getAnnuityReceivable,
  updateAnnuityDisplayedType,
  updateAnnuityInfo,
  updateAnnuityPayoutPeriod,
} from "@/lib/api/annuity-plans";
import type { AnnuityAgeOption, AnnuityConstraint } from "@/types";

import { AnnuityForm } from "./annuity-form";

function InfoData({
  isLoading,
  field,
  value,
}: {
  isLoading: boolean;
  field: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-1 border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {field}
      </div>
      <div className="col-span-3 px-2 py-1 text-sm text-neutral-600">
        {isLoading ? <Skeleton className="h-4 w-20" /> : value}
      </div>
    </div>
  );
}

/**
 * The single-life annuity editor. Shows the current annuity age / option (+ payout period when
 * the plan has payout options) with a display-type switch; enabling it reveals the
 * GENERAL-only receivable breakdown and the edit form. Saving PUTs the annuity info (and payout
 * period in parallel) and invalidates the sheet. Rendered in the GENERAL bottom bar and as a
 * floating button for defered/immediate (a gradient style).
 */
export function AnnuityTriggerButton({
  isAnnuityAgeFreeInput,
  annuityAgeOptions,
  annuityConstraint,
  annuityTypeOptions,
  isGeneral,
  payoutPeriodOptions = [],
}: {
  isAnnuityAgeFreeInput: boolean;
  annuityAgeOptions: AnnuityAgeOption[];
  annuityConstraint: AnnuityConstraint;
  annuityTypeOptions: string[];
  isGeneral: boolean;
  payoutPeriodOptions?: string[];
}) {
  const t = useTranslations("AnnuityPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasPayoutPeriod = payoutPeriodOptions.length > 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["annuityPlanSheet", sheetId] });

  const { data: annuityInfo, isFetching: isAnnuityInfoFetching } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "annuityInfo"],
    enabled: !!sheetId,
    queryFn: () => getAnnuityInfo(sheetId),
  });

  const { data: payoutPeriod, isFetching: isPayoutPeriodFetching } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "payoutPeriod"],
    enabled: !!sheetId && hasPayoutPeriod,
    queryFn: () => getAnnuityPayoutPeriod(sheetId),
  });

  const { data: annuityReceivable = [], isFetching: isReceivableFetching } =
    useQuery({
      queryKey: ["annuityPlanSheet", sheetId, "annuityReceivable"],
      enabled: !!sheetId && isGeneral,
      queryFn: () => getAnnuityReceivable(sheetId),
    });

  const { data: displayType, isFetching: isDisplayTypeFetching } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "displayType"],
    enabled: !!sheetId,
    queryFn: () => getAnnuityDisplayType(sheetId),
  });

  const { mutate: onUpdateDisplayType, isPending: isDisplayTypeUpdating } =
    useMutation({
      mutationFn: (vars: {
        isAnnuityEnabled: boolean;
        isCoupleAnnuityEnabled: boolean;
      }) => updateAnnuityDisplayedType({ sheetId, ...vars }),
      onSuccess: invalidate,
      onError: () => toast.error(t("annuityError")),
    });

  const { mutate: onSubmit, isPending: isSubmitting } = useMutation({
    mutationFn: async ({
      annuityAge,
      annuityOption,
      payoutPeriod: nextPayoutPeriod,
    }: {
      annuityAge: number;
      annuityOption: string;
      payoutPeriod?: string;
    }) => {
      const requests: Promise<void>[] = [
        updateAnnuityInfo({ sheetId, annuityOption, annuityAge }),
      ];
      if (nextPayoutPeriod !== undefined) {
        requests.push(
          updateAnnuityPayoutPeriod({ sheetId, value: nextPayoutPeriod }),
        );
      }
      await Promise.all(requests);
    },
    onSuccess: () => {
      setIsEditOpen(false);
      invalidate();
    },
    onError: () => toast.error(t("annuityError")),
  });

  return (
    <>
      {isGeneral ? (
        <Button
          variant="secondary"
          className="col-span-2"
          onClick={() => setIsInfoOpen(true)}
        >
          {t("annuity")}
        </Button>
      ) : (
        <Button
          onClick={() => setIsInfoOpen(true)}
          className="h-10 w-20 rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 font-bold text-white shadow-lg"
        >
          {t("annuity")}
        </Button>
      )}

      <BottomSheet open={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              {t("annuity")}
            </h2>
            <Switch
              id="annuity-display-type"
              checked={displayType?.isAnnuityEnabled ?? false}
              disabled={isDisplayTypeFetching || isDisplayTypeUpdating}
              onCheckedChange={(value) =>
                onUpdateDisplayType({
                  isAnnuityEnabled: value,
                  isCoupleAnnuityEnabled:
                    displayType?.isCoupleAnnuityEnabled ?? false,
                })
              }
            />
          </div>
          <div className="space-y-4 rounded-[22px] border bg-white p-4 sm:p-10">
            <InfoData
              isLoading={isAnnuityInfoFetching || !annuityInfo}
              field={t("annuityAge")}
              value={annuityInfo?.annuityAge?.toString()}
            />
            <InfoData
              isLoading={isAnnuityInfoFetching || !annuityInfo}
              field={t("annuityOption")}
              value={annuityInfo?.annuityOption}
            />
            {hasPayoutPeriod ? (
              <InfoData
                isLoading={isPayoutPeriodFetching || !payoutPeriod}
                field={t("payoutPeriod")}
                value={payoutPeriod}
              />
            ) : null}
            <Button
              disabled={!displayType?.isAnnuityEnabled}
              className="w-full space-x-2"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit />
              {t("change")}
            </Button>
          </div>
          {isGeneral && displayType?.isAnnuityEnabled ? (
            <div className="space-y-4">
              {isReceivableFetching ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                annuityReceivable.map((receivable) => (
                  <div
                    key={receivable.name}
                    className="grid grid-cols-2 gap-2 rounded-md border-2 border-zinc-300"
                  >
                    <div className="col-span-1 border-r bg-zinc-300 px-2 py-1 text-sm text-black">
                      {receivable.name}
                    </div>
                    <div className="col-span-1 px-2 py-1 text-sm text-neutral-600">
                      {receivable.value}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </BottomSheet>

      <BottomSheet open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        {annuityInfo ? (
          <AnnuityForm
            isLoading={isSubmitting}
            isAnnuityAgeFreeInput={isAnnuityAgeFreeInput}
            annuityAgeOptions={annuityAgeOptions}
            minAgeConstraint={annuityConstraint.minAge}
            maxAgeConstraint={annuityConstraint.maxAge}
            annuityTypeOptions={annuityTypeOptions}
            payoutPeriodOptions={payoutPeriodOptions}
            defaultAge={annuityInfo.annuityAge}
            defaultOption={annuityInfo.annuityOption}
            defaultPayoutPeriod={payoutPeriod}
            onSubmit={onSubmit}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
