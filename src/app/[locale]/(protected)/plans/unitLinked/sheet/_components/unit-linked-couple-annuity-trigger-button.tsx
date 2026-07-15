"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AnnuityForm } from "@/components/annuity-form";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUnitLinkedCoupleAnnuityInfo,
  updateUnitLinkedCoupleAnnuityInfo,
} from "@/lib/api/unit-linked-plans";
import type { AnnuityConstraint } from "@/types";

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
 * The type-C couple (joint/spouse) annuity editor: mirrors the single-life editor but reads /
 * writes the couple-annuity info (the age input is validated against the shared annuity
 * constraint; the option list is the couple type options). The screen only mounts it when the
 * couple-annuity range + options + constraint are present.
 */
export function UnitLinkedCoupleAnnuityTriggerButton({
  annuityConstraint,
  coupleAnnuityTypeOptions,
}: {
  annuityConstraint: AnnuityConstraint;
  coupleAnnuityTypeOptions: string[];
}) {
  const t = useTranslations("UnitLinkedPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: coupleAnnuityInfo, isFetching } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "coupleAnnuityInfo"],
    enabled: !!sheetId,
    queryFn: () => getUnitLinkedCoupleAnnuityInfo(sheetId),
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
      updateUnitLinkedCoupleAnnuityInfo({
        sheetId,
        coupleAnnuityAge: annuityAge,
        coupleAnnuityOption: annuityOption,
      }),
    onSuccess: () => {
      setIsEditOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["unitLinkedPlanSheet", sheetId],
      });
    },
    onError: () => toast.error(t("annuityError")),
  });

  return (
    <>
      <Button
        variant="secondary"
        className="relative col-span-1"
        onClick={() => setIsInfoOpen(true)}
      >
        <UsersRound />
      </Button>

      <BottomSheet
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title={t("coupleAnnuity")}
      >
        <div className="space-y-4 rounded-[22px] border bg-white p-4 sm:p-10">
          <InfoData
            isLoading={isFetching || !coupleAnnuityInfo}
            field={t("coupleAnnuityAge")}
            value={coupleAnnuityInfo?.coupleAnnuityAge?.toString()}
          />
          <InfoData
            isLoading={isFetching || !coupleAnnuityInfo}
            field={t("coupleAnnuityOption")}
            value={coupleAnnuityInfo?.coupleAnnuityOption}
          />
          <Button
            className="w-full space-x-2"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit />
            {t("change")}
          </Button>
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
            annuityTypeOptions={coupleAnnuityTypeOptions}
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
