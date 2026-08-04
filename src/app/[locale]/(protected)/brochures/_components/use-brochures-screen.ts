"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useBrochuresQuery } from "@/hooks/use-brochures-query";
import { useInView } from "@/hooks/use-in-view";
import { useMiniProgram } from "@/hooks/use-mini-program";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_BROCHURE_TAB, resolveBrochureTab } from "@/lib/brochures";
import { openPdf } from "@/lib/pdf-viewer";
import type { Brochure } from "@/types";

/**
 * State, URL sync, and data wiring for the brochures screen: derives the active category /
 * search / company from the URL, debounces the search box into the URL, runs the infinite
 * brochures query, and drives infinite scroll. `BrochuresScreen` consumes this and only renders.
 * Mirrors `usePlansScreen`, minus the plan-specific pay→sync→param tap gating.
 */
export function useBrochuresScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: authReady } = useAuthToken();
  const inMiniProgram = useMiniProgram();

  const tab = resolveBrochureTab(searchParams.get("tab"));
  const search = searchParams.get("search") ?? "";
  const companyId = searchParams.get("company") ?? undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);

  // Reflect external URL changes (back/forward) into the input.
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
    if (tabKey !== DEFAULT_BROCHURE_TAB.key) query.tab = tabKey;
    if (searchValue) query.search = searchValue;
    if (company) query.company = company;
    router.replace({ pathname: "/brochures", query }, { scroll: false });
  }

  // Debounce the search input into the URL.
  useEffect(() => {
    if (searchInput === search) return;
    const id = setTimeout(() => pushUrl({ search: searchInput }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const query = useBrochuresQuery({ tab, search, companyId });
  const brochures = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);

  const { ref: sentinelRef, inView } = useInView();
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query.hasNextPage, query.isFetchingNextPage, query]);

  // Open a brochure's PDF: the stored OSS url is rewritten onto the custom domain and
  // navigated to, and inside a Mini Program the url + name are also posted over the bridge.
  // See lib/pdf-viewer.ts; the promotions list uses the same hand-off.
  function onBrochurePress(brochure: Brochure) {
    void openPdf(
      { url: brochure.path, name: brochure.name },
      Boolean(inMiniProgram),
    );
  }

  return {
    tab,
    companyId,
    searchInput,
    setSearchInput,
    filterOpen,
    setFilterOpen,
    pushUrl,
    onBrochurePress,
    brochures,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    sentinelRef,
    showLoading: !authReady || query.isLoading,
  };
}
