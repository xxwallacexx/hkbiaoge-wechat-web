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
import type { UnitLinkedPlanCParamFormProps } from "@/types";

/**
 * The type-C unit-linked param form (step 2/2). Same submit shape as the A/B form, but `period`
 * is a free-numeric input (type C returns no `periodOptions`), validated as a whole number ≥ 1
 * (the backend requires `period` to parse as i16 ≥ 1). Mirrors the annuity GENERAL free-period
 * pattern + the mobile `UnitLinkedPlanCParamForm`.
 */
export function UnitLinkedPlanCParamForm({
  currencyOptions,
  currentInterestRateOptions,
  isSubmitting,
  onSubmit,
}: UnitLinkedPlanCParamFormProps) {
  const t = useTranslations("UnitLinkedPlan");

  const schema = z.object({
    period: z.string().regex(/^[1-9]\d*$/, t("periodMin", { min: 1 })),
    currency: z.string(),
    currentInterestRate: z.string(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      period: "1",
      currency: currencyOptions[0] ?? "",
      currentInterestRate: currentInterestRateOptions[0] ?? "",
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
          name="currentInterestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("currentInterestRate")}</FormLabel>
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
                  {currentInterestRateOptions.map((o) => (
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
