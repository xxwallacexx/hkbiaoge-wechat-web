"use client";

import { Loader2, PencilRuler, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlanPremiumCardProps } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "never",
  minimumFractionDigits: 0,
});

/**
 * Premium tuner shown in the bottom sheet: the agent enters an "expected installment",
 * which drives a debounced cal recompute (in the hook). Shows the resulting amount /
 * premium, an adjust fallback when the figure can't be hit exactly, and an optional
 * booster uplift. Mirrors the mobile PlanPremiumCard.
 */
export function PlanPremiumCard({
  expectedInstal,
  currency,
  amount,
  instal,
  isExpectedInstalError,
  isCalSubmitting,
  onExpectedInstalChange,
  isAdjustSubmitting,
  onAdjustSubmit,
  onGenerateSheetPress,
  isBoosterAvailable,
  isBoosterApplied,
  onBoosterPress,
  beforeBooster,
  afterBooster,
}: PlanPremiumCardProps) {
  const t = useTranslations("SavingPlan");

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="expected-instal">{t("inputExpectedInstal")}</Label>
        <Input
          id="expected-instal"
          type="number"
          inputMode="numeric"
          placeholder={t("inputExpectedInstal")}
          value={expectedInstal}
          onChange={(e) => onExpectedInstalChange(e.target.value)}
        />
      </div>

      <div className="h-px w-full bg-border" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("premiumAmount")}
          </span>
          {isCalSubmitting ? (
            <PulseBar />
          ) : (
            <span className="text-sm text-muted-foreground">
              {currency}$ {amount}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm",
                isExpectedInstalError
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {t("premium")}
            </span>
            {isCalSubmitting ? (
              <PulseBar />
            ) : (
              <span
                className={cn(
                  "text-sm",
                  isExpectedInstalError
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {currency}$ {instal}
              </span>
            )}
          </div>

          {isExpectedInstalError && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-sm text-destructive">
                {t("expectedInstalAdjust")}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAdjustSubmitting}
                onClick={onAdjustSubmit}
              >
                {isAdjustSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PencilRuler className="mr-2 h-4 w-4" />
                )}
                {t("adjust")}
              </Button>
            </div>
          )}

          {isBoosterAvailable &&
            !isBoosterApplied &&
            !isExpectedInstalError && (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full gap-2 text-primary"
                onClick={onBoosterPress}
              >
                <Rocket className="h-4 w-4" />
                {t("booster")}
              </Button>
            )}

          {isBoosterApplied && (
            <div className="mt-3 space-y-1 text-sm text-primary">
              <p>
                {t("afterBooster", {
                  afterBooster: currencyFormatter.format(afterBooster ?? 0),
                })}
              </p>
              <p>
                {t("beforeBooster", {
                  beforeBooster: currencyFormatter.format(beforeBooster ?? 0),
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={expectedInstal === "" || isCalSubmitting}
        onClick={onGenerateSheetPress}
      >
        {isCalSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("generateSheet")}
      </Button>
    </div>
  );
}

function PulseBar() {
  return (
    <div className="h-5 w-28 animate-pulse rounded bg-muted-foreground/20" />
  );
}
