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
import type { SavingPlanParamFormProps } from "@/types";

/**
 * Collects the client's basic info (name / age / sex / period / currency) and submits it
 * to compute a premium. Ported from the mobile SavingPlanParamForm (Formik + Yup → react-
 * hook-form + zod). The sex value stays the backend literal `男`/`女`; only the label is
 * localized.
 */
export function SavingPlanParamForm({
  periodOptions,
  currencyOptions,
  isSubmitting,
  onSubmit,
}: SavingPlanParamFormProps) {
  const t = useTranslations("SavingPlan");

  const schema = z.object({
    name: z.string().min(1, t("nameRequired")),
    age: z.string().min(1, t("ageRequired")).regex(/^\d+$/, t("numberType")),
    sex: z.string(),
    period: z.string(),
    currency: z.string(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      age: "",
      sex: "男",
      period: periodOptions[0],
      currency: currencyOptions[0],
    },
  });

  const sexOptions = [
    { value: "男", label: t("male") },
    { value: "女", label: t("female") },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            name: values.name,
            age: Number(values.age),
            sex: values.sex,
            period: values.period,
            currency: values.currency,
          }),
        )}
        className="space-y-4 py-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>*{t("name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("inputName")}
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
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>*{t("age")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("inputAge")}
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
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sex")}</FormLabel>
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
                  {sexOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
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
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("period")}</FormLabel>
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
                  {periodOptions.map((o) => (
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
