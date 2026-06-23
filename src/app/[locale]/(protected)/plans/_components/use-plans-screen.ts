"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useInView } from "@/hooks/use-in-view";
import { usePlansQuery } from "@/hooks/use-plans-query";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_TAB, resolveTab } from "@/lib/plans";

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

  return {
    tab,
    companyId,
    searchInput,
    setSearchInput,
    filterOpen,
    setFilterOpen,
    pushUrl,
    goBack: () => router.back(),
    plans,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    sentinelRef,
    showLoading: !authReady || query.isLoading,
  };
}
