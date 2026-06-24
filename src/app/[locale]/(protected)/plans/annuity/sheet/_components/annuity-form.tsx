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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnnuityAgeOption } from "@/types";

/**
 * Shared editor for an annuity selection (single-life or couple): an age (free-input or a
 * select of `annuityAgeOptions`), an option (`annuityTypeOptions`), and — only when
 * `payoutPeriodOptions` is non-empty — a payout period. The age bounds come from the param's
 * annuity constraint. Submitting hands the values back to the trigger's mutation.
 */
export function AnnuityForm({
  isLoading = false,
  isAnnuityAgeFreeInput,
  annuityAgeOptions,
  minAgeConstraint,
  maxAgeConstraint,
  annuityTypeOptions,
  payoutPeriodOptions,
  defaultAge,
  defaultOption,
  defaultPayoutPeriod,
  onSubmit,
}: {
  isLoading?: boolean;
  isAnnuityAgeFreeInput: boolean;
  annuityAgeOptions: AnnuityAgeOption[];
  minAgeConstraint: number;
  maxAgeConstraint: number;
  annuityTypeOptions: string[];
  payoutPeriodOptions: string[];
  defaultAge: number;
  defaultOption: string;
  defaultPayoutPeriod?: string;
  onSubmit: (values: {
    annuityAge: number;
    annuityOption: string;
    payoutPeriod?: string;
  }) => void;
}) {
  const t = useTranslations("AnnuityPlan");
  const hasPayoutPeriod = payoutPeriodOptions.length > 0;

  const baseSchema = z.object({
    annuityAge: z.coerce
      .number()
      .min(minAgeConstraint, {
        message: t("annuityAgeMin", { min: minAgeConstraint }),
      })
      .max(maxAgeConstraint, {
        message: t("annuityAgeMax", { max: maxAgeConstraint }),
      }),
    annuityOption: z.string(),
  });

  const formSchema = hasPayoutPeriod
    ? baseSchema.extend({ payoutPeriod: z.string() })
    : baseSchema;

  type FormValues = z.infer<typeof baseSchema> & { payoutPeriod?: string };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      annuityAge: defaultAge,
      annuityOption: defaultOption,
      ...(hasPayoutPeriod && { payoutPeriod: defaultPayoutPeriod }),
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="annuityAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("annuityAge")}</FormLabel>
              <FormControl>
                {isAnnuityAgeFreeInput ? (
                  <Input
                    type="number"
                    placeholder={t("annuityAge")}
                    {...field}
                  />
                ) : (
                  <Select
                    defaultValue={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("annuityAge")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {annuityAgeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="annuityOption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("annuityOption")}</FormLabel>
              <FormControl>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("annuityOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {annuityTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {hasPayoutPeriod && (
          <FormField
            control={form.control}
            name="payoutPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("payoutPeriod")}</FormLabel>
                <FormControl>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("payoutPeriod")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {payoutPeriodOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("confirm")}
        </Button>
      </form>
    </Form>
  );
}
