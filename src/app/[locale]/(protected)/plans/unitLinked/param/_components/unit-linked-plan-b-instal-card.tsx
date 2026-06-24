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
import type { UnitLinkedPlanBInstalCardProps } from "@/types";

/**
 * Type-B premium sheet (step 2 of 2): the agent picks an installment within the
 * `[minInstal, maxInstal]` range from the amount step, which `PUT /install`s (in the hook)
 * then generates the sheet. Mirrors the mobile UnitLinkedPlanBInstalCard.
 */
export function UnitLinkedPlanBInstalCard({
  currency,
  minInstal,
  maxInstal,
  isSubmitting,
  onSubmit,
}: UnitLinkedPlanBInstalCardProps) {
  const t = useTranslations("UnitLinkedPlan");

  const schema = z.object({
    install: z
      .string()
      .min(1, t("premiumRequired"))
      .regex(/^\d+$/, t("numberType"))
      .refine(
        (v) => Number(v) >= minInstal,
        t("minPremiumLimit", { currency, minInstal }),
      )
      .refine(
        (v) => Number(v) <= maxInstal,
        t("premiumLimit", { currency, maxInstal }),
      ),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    // The installment must be an integer (the API is Json<i32>); start at the range floor.
    defaultValues: { install: String(Math.ceil(minInstal)) },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit(Number(values.install)),
        )}
        className="mx-auto w-full max-w-xl space-y-4"
      >
        <FormField
          control={form.control}
          name="install"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("premium")} ({currency}$ {minInstal} - {currency}${" "}
                {maxInstal})
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={t("inputPremium")}
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
          className="w-full"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("generateSheet")}
        </Button>
      </form>
    </Form>
  );
}
