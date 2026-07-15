"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, HandCoins } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AnnuityForm } from "@/components/annuity-form";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUnitLinkedAnnuityInfo,
  updateUnitLinkedAnnuityInfo,
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
 * The type-C single-life annuity editor: shows the current annuity age / option and lets the
 * agent change them via the shared `AnnuityForm`. Simpler than the annuity-sheet editor — no
 * display-type toggle / receivable / payout (mirrors the webview type-C editor). The screen
 * only mounts it when the annuity range + options + constraint are present.
 */
export function UnitLinkedAnnuityTriggerButton({
  annuityConstraint,
  annuityTypeOptions,
}: {
  annuityConstraint: AnnuityConstraint;
  annuityTypeOptions: string[];
}) {
  const t = useTranslations("UnitLinkedPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: annuityInfo, isFetching } = useQuery({
    queryKey: ["unitLinkedPlanSheet", sheetId, "annuityInfo"],
    enabled: !!sheetId,
    queryFn: () => getUnitLinkedAnnuityInfo(sheetId),
  });

  const { mutate: onSubmit, isPending: isSubmitting } = useMutation({
    mutationFn: ({
      annuityAge,
      annuityOption,
    }: {
      annuityAge: number;
      annuityOption: string;
      payoutPeriod?: string;
    }) => updateUnitLinkedAnnuityInfo({ sheetId, annuityAge, annuityOption }),
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
        <HandCoins />
      </Button>

      <BottomSheet
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title={t("annuity")}
      >
        <div className="space-y-4 rounded-[22px] border bg-white p-4 sm:p-10">
          <InfoData
            isLoading={isFetching || !annuityInfo}
            field={t("annuityAge")}
            value={annuityInfo?.annuityAge?.toString()}
          />
          <InfoData
            isLoading={isFetching || !annuityInfo}
            field={t("annuityOption")}
            value={annuityInfo?.annuityOption}
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
        {annuityInfo ? (
          <AnnuityForm
            isLoading={isSubmitting}
            isAnnuityAgeFreeInput={true}
            annuityAgeOptions={[]}
            minAgeConstraint={annuityConstraint.minAge}
            maxAgeConstraint={annuityConstraint.maxAge}
            annuityTypeOptions={annuityTypeOptions}
            payoutPeriodOptions={[]}
            defaultAge={annuityInfo.annuityAge}
            defaultOption={annuityInfo.annuityOption}
            onSubmit={onSubmit}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
