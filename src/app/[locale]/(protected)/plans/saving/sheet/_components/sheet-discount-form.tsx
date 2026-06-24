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

/** Edit a single year's discount rate. `index` is 1-based for display. */
export function SheetDiscountForm({
  index,
  defaultValue,
  isLoading = false,
  onSubmit,
}: {
  index: number;
  defaultValue: number;
  isLoading?: boolean;
  onSubmit: (args: { value: number }) => void;
}) {
  const t = useTranslations("SavingPlan");
  const formSchema = z.object({ value: z.coerce.number() });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: defaultValue },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ value }) => onSubmit({ value }))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("discountChangeLabel", { index })}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t("discount")} {...field} />
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
