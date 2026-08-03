"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CompanyFilterSheet } from "./company-filter-sheet";
import { PromotionCard } from "./promotion-card";
import { usePromotionsScreen } from "./use-promotions-screen";

/**
 * The promotions (優惠推廣) screen: a title, a company filter, and an infinite-scroll list of
 * promotion flyers; tapping a row opens its PDF. All state / URL / data wiring lives in
 * `usePromotionsScreen`; this component is presentation only. A slimmer sibling of the
 * brochures screen — no search box (the API takes no `search` param) and no category sidebar.
 */
export function PromotionsScreen() {
  const t = useTranslations("Promotions");
  const {
    companyId,
    setCompany,
    filterOpen,
    setFilterOpen,
    onPromotionPress,
    promotions,
    isError,
    isFetchingNextPage,
    sentinelRef,
    showLoading,
  } = usePromotionsScreen();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Blue header: centred title with the filter pinned right. `secondary` so the button
          reads against the blue — on /plans and /brochures a white search input supplies that
          contrast instead. */}
      <div className="bg-gradient-to-b from-primary to-primary/90 px-4 py-3 text-primary-foreground">
        <div className="relative flex min-h-11 items-center justify-center">
          <h1 className="max-w-[calc(100%-8rem)] truncate text-xl font-bold md:text-2xl">
            {t("title")}
          </h1>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFilterOpen(true)}
            className={cn(
              "absolute right-0 gap-1.5",
              companyId &&
                "ring-2 ring-white ring-offset-2 ring-offset-primary",
            )}
          >
            {t("filter")}
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            {t("error")}
          </p>
        ) : showLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : promotions.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <>
            {promotions.map((promotion) => (
              <PromotionCard
                key={promotion._id}
                promotion={promotion}
                onPress={() => onPromotionPress(promotion)}
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

      <CompanyFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selectedId={companyId}
        onSelect={(id) => {
          setCompany(id);
          setFilterOpen(false);
        }}
      />
    </main>
  );
}
