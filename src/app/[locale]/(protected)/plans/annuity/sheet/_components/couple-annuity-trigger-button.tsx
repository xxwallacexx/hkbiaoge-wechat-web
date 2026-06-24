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
  getCoupleAnnuityInfo,
  getCoupleAnnuityReceivable,
  updateAnnuityDisplayedType,
  updateCoupleAnnuityInfo,
} from "@/lib/api/annuity-plans";
import type { AnnuityConstraint } from "@/types";

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
    <div className="grid grid-cols-5 gap-2 rounded-md border-2 border-zinc-300">
      <div className="col-span-2 border-r bg-zinc-300 px-2 py-1 text-sm text-black">
        {field}
      </div>
      <div className="col-span-3 px-2 py-1 text-sm text-neutral-600">
        {isLoading ? <Skeleton className="h-4 w-20" /> : value}
      </div>
    </div>
  );
}

/**
 * The joint/spouse annuity editor (GENERAL only). Mirrors the single-life editor but writes the
 * couple-annuity info and toggles the couple display-type flag (sharing the display-type query
 * with the single-life editor). The couple sub-resources 409 when the plan has no couple-annuity
 * config, so the reads are gated on `coupleAnnuityTypeOptions` being present.
 */
export function CoupleAnnuityTriggerButton({
  annuityConstraint,
  coupleAnnuityTypeOptions,
}: {
  annuityConstraint: AnnuityConstraint;
  coupleAnnuityTypeOptions?: string[];
}) {
  const t = useTranslations("AnnuityPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasCoupleAnnuity = (coupleAnnuityTypeOptions?.length ?? 0) > 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["annuityPlanSheet", sheetId] });

  const { data: coupleAnnuityInfo, isFetching: isInfoFetching } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "coupleAnnuityInfo"],
    enabled: !!sheetId && hasCoupleAnnuity,
    queryFn: () => getCoupleAnnuityInfo(sheetId),
  });

  const { data: receivable = [], isFetching: isReceivableFetching } = useQuery({
    queryKey: ["annuityPlanSheet", sheetId, "coupleAnnuityReceivable"],
    enabled: !!sheetId && hasCoupleAnnuity,
    queryFn: () => getCoupleAnnuityReceivable(sheetId),
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
    mutationFn: ({
      annuityAge,
      annuityOption,
    }: {
      annuityAge: number;
      annuityOption: string;
      payoutPeriod?: string;
    }) =>
      updateCoupleAnnuityInfo({
        sheetId,
        coupleAnnuityAge: annuityAge,
        coupleAnnuityOption: annuityOption,
      }),
    onSuccess: () => {
      setIsEditOpen(false);
      invalidate();
    },
    onError: () => toast.error(t("annuityError")),
  });

  return (
    <>
      <Button
        variant="secondary"
        className="col-span-2"
        onClick={() => setIsInfoOpen(true)}
      >
        {t("coupleAnnuity")}
      </Button>

      <BottomSheet open={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2
              id="couple-annuity-display-type-label"
              className="text-lg font-semibold text-muted-foreground"
            >
              {t("coupleAnnuity")}
            </h2>
            <Switch
              id="couple-annuity-display-type"
              aria-labelledby="couple-annuity-display-type-label"
              checked={displayType?.isCoupleAnnuityEnabled ?? false}
              disabled={isDisplayTypeFetching || isDisplayTypeUpdating}
              onCheckedChange={(value) =>
                onUpdateDisplayType({
                  isAnnuityEnabled: displayType?.isAnnuityEnabled ?? false,
                  isCoupleAnnuityEnabled: value,
                })
              }
            />
          </div>
          <div className="space-y-4 rounded-[22px] border bg-white p-4 sm:p-10">
            <InfoData
              isLoading={isInfoFetching || !coupleAnnuityInfo}
              field={t("coupleAnnuityAge")}
              value={coupleAnnuityInfo?.coupleAnnuityAge?.toString()}
            />
            <InfoData
              isLoading={isInfoFetching || !coupleAnnuityInfo}
              field={t("coupleAnnuityOption")}
              value={coupleAnnuityInfo?.coupleAnnuityOption}
            />
            <Button
              disabled={!displayType?.isCoupleAnnuityEnabled}
              className="w-full space-x-2"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit />
              {t("change")}
            </Button>
          </div>
          {displayType?.isCoupleAnnuityEnabled ? (
            <div className="space-y-4">
              {isReceivableFetching ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                receivable.map((entry) => (
                  <div
                    key={entry.name}
                    className="grid grid-cols-2 gap-2 rounded-md border-2 border-zinc-300"
                  >
                    <div className="col-span-1 border-r bg-zinc-300 px-2 py-1 text-sm text-black">
                      {entry.name}
                    </div>
                    <div className="col-span-1 px-2 py-1 text-sm text-neutral-600">
                      {entry.value}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </BottomSheet>

      <BottomSheet open={isEditOpen} onClose={() => setIsEditOpen(false)}>
        {coupleAnnuityInfo ? (
          <AnnuityForm
            isLoading={isSubmitting}
            isAnnuityAgeFreeInput={true}
            annuityAgeOptions={[]}
            minAgeConstraint={annuityConstraint.minAge}
            maxAgeConstraint={annuityConstraint.maxAge}
            annuityTypeOptions={coupleAnnuityTypeOptions ?? []}
            payoutPeriodOptions={[]}
            defaultAge={coupleAnnuityInfo.coupleAnnuityAge}
            defaultOption={coupleAnnuityInfo.coupleAnnuityOption}
            onSubmit={onSubmit}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
