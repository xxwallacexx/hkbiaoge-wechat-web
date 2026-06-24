"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { RefObject } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateAnnuityPlanSheetWithdrawal } from "@/lib/api/annuity-plans";

/**
 * Sets a withdrawal across one or more consecutive years for a row in the worksheet. On
 * success it closes the dialog and invalidates the sheet so the table re-derives.
 */
export function WithdrawalForm({
  closeRef,
  startRow,
  maxWithdrawalPeriod,
  defaultValue,
}: {
  closeRef: RefObject<HTMLButtonElement | null>;
  startRow: number;
  maxWithdrawalPeriod: number;
  defaultValue: number;
}) {
  const t = useTranslations("AnnuityPlan");
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const queryClient = useQueryClient();

  const { mutate: onSubmit, isPending: isLoading } = useMutation({
    mutationFn: (vars: { startRow: number; endRow: number; value: number }) =>
      updateAnnuityPlanSheetWithdrawal({ sheetId, ...vars }),
    onSuccess: () => {
      closeRef.current?.click();
      queryClient.invalidateQueries({
        queryKey: ["annuityPlanSheet", sheetId],
      });
    },
    onError: () => toast.error(t("withdrawalError")),
  });

  const formSchema = z.object({
    withdrawalPeriod: z.coerce
      .number()
      .min(1, { message: t("withdrawalPeriodMin") })
      .max(maxWithdrawalPeriod, {
        message: t("withdrawalPeriodMax", { max: maxWithdrawalPeriod }),
      }),
    value: z.coerce.number().min(0, { message: t("withdrawalAmountMin") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      withdrawalPeriod: 1,
      value: defaultValue,
    },
  });

  const onWithdrawalSubmit = (values: z.infer<typeof formSchema>) => {
    const endRow = startRow - 1 + values.withdrawalPeriod;
    onSubmit({ startRow, endRow, value: values.value });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onWithdrawalSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="withdrawalPeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("withdrawalPeriodLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("withdrawalPeriodLabel")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("withdrawalAmountLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("withdrawalAmountLabel")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("confirm")}
        </Button>
      </form>
    </Form>
  );
}
