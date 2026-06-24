"use client";

import { ChevronLeft, Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAN_TABS } from "@/lib/plans";
import { cn } from "@/lib/utils";

import { CompanyFilterSheet } from "./company-filter-sheet";
import { PlanCard } from "./plan-card";
import { usePlansScreen } from "./use-plans-screen";

/**
 * The insurance-products screen: search box, company filter sheet, vertical category
 * sidebar, and an infinite-scroll product list. All state / URL / data wiring lives in
 * `usePlansScreen`; this component is presentation only.
 */
export function PlansScreen() {
  const t = useTranslations("Plans");
  const {
    tab,
    companyId,
    searchInput,
    setSearchInput,
    filterOpen,
    setFilterOpen,
    pushUrl,
    goBack,
    onPlanPress,
    canOpenPlan,
    plans,
    isError,
    isFetchingNextPage,
    sentinelRef,
    showLoading,
  } = usePlansScreen();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Blue header: title + search row */}
      <div className="bg-gradient-to-b from-primary to-primary/90 px-4 pb-4 pt-3 text-primary-foreground">
        <div className="relative flex items-center justify-center py-1">
          <button
            type="button"
            onClick={goBack}
            aria-label={t("back")}
            className="absolute left-0 rounded-full p-1.5 hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold md:text-2xl">{t("title")}</h1>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 flex-1 border-0 bg-white text-foreground"
          />
          <Button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "h-11 shrink-0 gap-1.5",
              companyId &&
                "ring-2 ring-white ring-offset-2 ring-offset-primary",
            )}
          >
            {t("filter")}
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body: vertical category tabs + scrollable list */}
      <div className="flex min-h-0 flex-1">
        <nav className="w-24 shrink-0 overflow-y-auto border-r bg-muted/30 md:w-32">
          {PLAN_TABS.map((tb) => {
            const active = tb.key === tab.key;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => pushUrl({ tab: tb.key })}
                className={cn(
                  "w-full border-l-4 px-2 py-4 text-center text-sm md:text-base",
                  active
                    ? "border-primary bg-background font-semibold text-primary"
                    : "border-transparent text-foreground/80 hover:bg-background/60",
                )}
              >
                {t(tb.labelKey)}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto">
          {isError ? (
            <p className="p-6 text-center text-sm text-destructive">
              {t("error")}
            </p>
          ) : showLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <>
              {plans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onPress={canOpenPlan ? () => onPlanPress(plan) : undefined}
                />
              ))}
              <div ref={sentinelRef} aria-hidden className="h-px" />
              {isFetchingNextPage && (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CompanyFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedId={companyId}
        onSelect={(id) => {
          pushUrl({ company: id });
          setFilterOpen(false);
        }}
      />
    </main>
  );
}
