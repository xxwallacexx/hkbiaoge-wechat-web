"use client";

import { ChevronLeft, Loader2, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useInView } from "@/hooks/use-in-view";
import { usePlansQuery } from "@/hooks/use-plans-query";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_TAB, PLAN_TABS, resolveTab } from "@/lib/plans";
import { cn } from "@/lib/utils";

import { CompanyFilterSheet } from "./company-filter-sheet";
import { PlanCard } from "./plan-card";

/**
 * The insurance-products screen: a search box, a company filter sheet, a vertical
 * category sidebar, and an infinite-scroll product list. Tab + search + company filter
 * live in the URL (`?tab=&search=&company=`) so the view is shareable.
 */
export function PlansScreen() {
  const t = useTranslations("Plans");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: authReady } = useAuthToken();

  const tab = resolveTab(searchParams.get("tab"));
  const search = searchParams.get("search") ?? "";
  const companyId = searchParams.get("company") ?? undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);

  // Reflect external URL changes (back/forward) into the input.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Merge a change into the current tab/search/company URL state (locale-aware).
  function pushUrl(next: {
    tab?: string;
    search?: string;
    company?: string | undefined;
  }) {
    const tabKey = next.tab ?? tab.key;
    const searchValue = next.search ?? search;
    const company = "company" in next ? next.company : companyId;
    const query: Record<string, string> = {};
    if (tabKey !== DEFAULT_TAB.key) query.tab = tabKey;
    if (searchValue) query.search = searchValue;
    if (company) query.company = company;
    router.replace({ pathname: "/plans", query }, { scroll: false });
  }

  // Debounce the search input into the URL.
  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => pushUrl({ search: searchInput }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = usePlansQuery({ tab, search, companyId });
  const plans = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  const { ref: sentinelRef, inView } = useInView();
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query.hasNextPage, query.isFetchingNextPage, query]);

  const showLoading = !authReady || query.isLoading;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Blue header: title + search row */}
      <div className="bg-gradient-to-b from-primary to-primary/90 px-4 pb-4 pt-3 text-primary-foreground">
        <div className="relative flex items-center justify-center py-1">
          <button
            type="button"
            onClick={() => router.back()}
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
          {query.isError ? (
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
                <PlanCard key={plan._id} plan={plan} />
              ))}
              <div ref={sentinelRef} aria-hidden className="h-px" />
              {query.isFetchingNextPage && (
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
