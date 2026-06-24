"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UnitLinkedPlanBAmountCardProps } from "@/types";

/**
 * Type-B premium sheet (step 1 of 2): the agent enters an insured amount, which drives a
 * debounced `PUT /amount` (in the hook) returning a premium RANGE. "Next" hands off to the
 * installment sheet. Mirrors the mobile UnitLinkedPlanBAmountCard.
 */
export function UnitLinkedPlanBAmountCard({
  expectedAmount,
  currency,
  amount,
  isAmountSubmitting,
  onExpectedAmountChange,
  onNextButtonPress,
  estimatedInstal,
  maxInstal,
}: UnitLinkedPlanBAmountCardProps) {
  const t = useTranslations("UnitLinkedPlan");
  const hasRange = estimatedInstal !== undefined && maxInstal !== undefined;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="expected-amount">{t("inputInsuredAmount")}</Label>
        <Input
          id="expected-amount"
          type="number"
          inputMode="numeric"
          placeholder={t("inputInsuredAmount")}
          value={expectedAmount}
          onChange={(e) => onExpectedAmountChange(e.target.value)}
        />
      </div>

      <div className="h-px w-full bg-border" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("insuredAmount")}
          </span>
          {isAmountSubmitting ? (
            <PulseBar />
          ) : (
            <span className="text-sm text-muted-foreground">
              {currency}$ {amount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("premium")}</span>
          {isAmountSubmitting ? (
            <PulseBar />
          ) : (
            <span className="text-sm text-muted-foreground">
              {hasRange
                ? `${currency}$ ${estimatedInstal} - ${currency}$ ${maxInstal}`
                : t("inputInsuredAmount")}
            </span>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={expectedAmount === "" || !hasRange || isAmountSubmitting}
        onClick={onNextButtonPress}
      >
        {isAmountSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {t("next")}
      </Button>
    </div>
  );
}

function PulseBar() {
  return (
    <div className="h-5 w-28 animate-pulse rounded bg-muted-foreground/20" />
  );
}
