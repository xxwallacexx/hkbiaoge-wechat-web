"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useInView } from "@/hooks/use-in-view";
import { usePlansQuery } from "@/hooks/use-plans-query";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_TAB, resolveTab } from "@/lib/plans";
import type { PlanOverview } from "@/types";

/**
 * State, URL sync, and data wiring for the products screen: derives the active tab /
 * search / company from the URL, debounces the search box into the URL, runs the
 * infinite plans query, and drives infinite scroll. `PlansScreen` consumes this and
 * only renders.
 */
export function usePlansScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: authReady } = useAuthToken();

  const tab = resolveTab(searchParams.get("tab"));
  const search = searchParams.get("search") ?? "";
  const companyId = searchParams.get("company") ?? undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);

  // Reflect external URL changes (back/forward) into the input. Mirroring an external
  // system (the URL) into local state is the intended use of this effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Open a plan from the list, mirroring the mobile gating: pay first if unpaid, wait for
  // the worksheet to sync if it isn't ready, otherwise open the param screen with the
  // synced sheet's driveItemId. Only ported plan types carry a `paramPath`.
  function onPlanPress(plan: PlanOverview) {
    const dest = tab.paramPath;
    if (!dest) return;
    const planId = plan._id;
    if (!plan.paymentDetail?.completedAt) {
      router.push({
        pathname: "/plans/payment",
        query: { planId, destination: dest },
      });
      return;
    }
    if (!plan.sheetDetail?.isSynced || !plan.sheetDetail.driveItemId) {
      router.push({
        pathname: "/plans/sheetSync",
        query: { planId, destination: dest },
      });
      return;
    }
    router.push({
      pathname: dest,
      query: { planId, sheetId: plan.sheetDetail.driveItemId },
    });
  }

  return {
    tab,
    companyId,
    searchInput,
    setSearchInput,
    filterOpen,
    setFilterOpen,
    pushUrl,
    onPlanPress,
    canOpenPlan: !!tab.paramPath,
    plans,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    sentinelRef,
    showLoading: !authReady || query.isLoading,
  };
}
