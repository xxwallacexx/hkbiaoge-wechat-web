"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnnuityGeneralParamFormProps } from "@/types";

/**
 * The GENERAL annuity param form (step 2/2): a free-numeric `period` validated against the
 * plan's `periodConstraint` (an allow-list and/or a min..max range), a `currency` select, and a
 * free-numeric `amount`. Submitting writes the info and goes straight to the sheet (no premium
 * sheet — the amount is the user's input, not a computed premium).
 */
export function AnnuityPlanGeneralParamForm({
  periodConstraint,
  currencyOptions,
  isSubmitting,
  onSubmit,
}: AnnuityGeneralParamFormProps) {
  const t = useTranslations("AnnuityPlan");

  const min = periodConstraint?.min ?? 1;
  const max = periodConstraint?.max ?? Number.MAX_SAFE_INTEGER;
  const oneOf = periodConstraint?.oneOf ?? [];

  const schema = z.object({
    period: z
      .string()
      .min(1, t("numberType"))
      .regex(/^\d+$/, t("numberType"))
      .refine(
        (v) =>
          oneOf.includes(Number(v)) || (Number(v) >= min && Number(v) <= max),
        t("periodConstraint", { min, max }),
      ),
    currency: z.string(),
    amount: z
      .string()
      .min(1, t("amountRequired"))
      .regex(/^\d+$/, t("numberType")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      period: "1",
      currency: currencyOptions[0] ?? "",
      amount: "40000",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("period")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("period")}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("currency")}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pleaseSelect")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencyOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("amount")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("amountRequired")}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="mt-4 w-full"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("next")}
        </Button>
      </form>
    </Form>
  );
}
