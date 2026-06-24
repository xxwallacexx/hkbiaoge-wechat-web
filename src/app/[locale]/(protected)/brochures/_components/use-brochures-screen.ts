"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useBrochuresQuery } from "@/hooks/use-brochures-query";
import { useInView } from "@/hooks/use-in-view";
import { useMiniProgram } from "@/hooks/use-mini-program";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_BROCHURE_TAB, resolveBrochureTab } from "@/lib/brochures";
import { wechat } from "@/lib/wechat";
import type { Brochure } from "@/types";

/**
 * The client-owned native Mini Program page that downloads + displays a PDF (it runs
 * `wx.downloadFile` then `wx.openDocument` — a web-view cannot open documents itself). It
 * receives the PDF `url` (+ `name`) as query params. Set this to the client's actual page route.
 */
const BROCHURE_PDF_PAGE = "/pages/pdf/index";

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

  // Open a brochure's PDF. A Mini Program web-view can't open documents itself, so inside one we
  // hand the PDF url to the client's native viewer page via the bridge (it runs wx.downloadFile +
  // wx.openDocument). Outside the Mini Program (a plain browser) open the PDF directly.
  function onBrochurePress(brochure: Brochure) {
    if (inMiniProgram) {
      const params = new URLSearchParams({
        url: brochure.path,
        name: brochure.name,
      });
      wechat.navigateTo(`${BROCHURE_PDF_PAGE}?${params.toString()}`);
      return;
    }
    window.open(brochure.path, "_blank", "noopener,noreferrer");
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
