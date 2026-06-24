"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnnuityDeferedParamFormProps,
  AnnuityDeferedParamFormValues,
} from "@/types";

/**
 * The non-GENERAL (defered / immediate) annuity param form (step 2/2): period + currency
 * selects, both defaulted so the form is always valid. Submitting opens the premium sheet.
 */
export function AnnuityPlanDeferedParamForm({
  periodOptions,
  currencyOptions,
  isSubmitting,
  onSubmit,
}: AnnuityDeferedParamFormProps) {
  const t = useTranslations("AnnuityPlan");

  const form = useForm<AnnuityDeferedParamFormValues>({
    mode: "onChange",
    defaultValues: {
      period: periodOptions[0] ?? "",
      currency: currencyOptions[0] ?? "",
    },
  });

  const fields: {
    name: keyof AnnuityDeferedParamFormValues;
    options: string[];
  }[] = [
    { name: "period", options: periodOptions },
    { name: "currency", options: currencyOptions },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        {fields.map(({ name, options }) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(name)}</FormLabel>
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
                    {options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" className="mt-4 w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("next")}
        </Button>
      </form>
    </Form>
  );
}
