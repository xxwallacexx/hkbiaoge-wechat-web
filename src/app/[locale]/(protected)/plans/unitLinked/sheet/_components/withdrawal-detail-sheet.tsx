"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";
import { updateUnitLinkedPlanSheetWithdrawal } from "@/lib/api/unit-linked-plans";
import { currencyFormatter } from "@/lib/utils";
import type { WithdrawalData } from "@/types";

/**
 * Withdrawal overview: a per-year bar chart of withdrawals plus a "清零" button that zeroes
 * the whole withdrawal column. Mutations go through the shared api client and invalidate the
 * sheet on success.
 */
export function WithdrawalDetailSheet({
  onClose,
  data = [],
}: {
  onClose: () => void;
  data: WithdrawalData[];
}) {
  const t = useTranslations("UnitLinkedPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();

  const chartConfig = {
    withdrawal: {
      label: t("withdrawalChartLabel"),
      color: "#2563eb",
    },
  } satisfies ChartConfig;

  const { mutate: onSubmit, isPending: isLoading } = useMutation({
    mutationFn: (vars: { startRow: number; endRow: number; value: number }) =>
      updateUnitLinkedPlanSheetWithdrawal({ sheetId, ...vars }),
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({
        queryKey: ["unitLinkedPlanSheet", sheetId],
      });
    },
    onError: () => toast.error(t("withdrawalError")),
  });

  // Sums ALL withdrawals; the bottom-bar badge instead counts only those > 0. Both mirror
  // the webview source's two different reductions.
  const totalWithdrawal = data.reduce((prev, acc) => prev + acc.withdrawal, 0);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Label>
        {t("totalWithdrawal")}: {currencyFormatter(totalWithdrawal)}
      </Label>
      <ChartContainer
        config={chartConfig}
        className="min-h-[200px] w-full lg:w-[60%]"
      >
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <YAxis
            dataKey="withdrawal"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            interval="preserveEnd"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="withdrawal" fill="var(--color-withdrawal)" radius={4} />
        </BarChart>
      </ChartContainer>
      <Button
        disabled={isLoading}
        className="w-full"
        onClick={() =>
          onSubmit({ startRow: 2, endRow: data.length + 1, value: 0 })
        }
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t("clearWithdrawal")}
      </Button>
    </div>
  );
}
