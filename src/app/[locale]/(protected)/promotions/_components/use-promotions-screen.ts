"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useInView } from "@/hooks/use-in-view";
import { useMiniProgram } from "@/hooks/use-mini-program";
import { usePromotionsQuery } from "@/hooks/use-promotions-query";
import { useRouter } from "@/i18n/navigation";
import { openPdf } from "@/lib/pdf-viewer";
import type { Promotion } from "@/types";

/**
 * State, URL sync, and data wiring for the promotions screen: derives the company filter from
 * the URL, runs the infinite promotions query, and drives infinite scroll. `PromotionsScreen`
 * consumes this and only renders. A slimmer `useBrochuresScreen` — `GET /promotion` accepts
 * neither a category nor a search term (only limit / skip / insuranceCompanyId), so there is
 * one URL param and no debounce.
 */
export function usePromotionsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready: authReady } = useAuthToken();
  const inMiniProgram = useMiniProgram();

  const companyId = searchParams.get("company") ?? undefined;
  const [filterOpen, setFilterOpen] = useState(false);

  /** Keep the filter in the URL so back / forward and a reload preserve it (locale-aware). */
  function setCompany(next: string | undefined) {
    router.replace(
      { pathname: "/promotions", query: next ? { company: next } : {} },
      { scroll: false },
    );
  }

  const query = usePromotionsQuery(companyId);
  const promotions = useMemo(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  const { ref: sentinelRef, inView } = useInView();
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query.hasNextPage, query.isFetchingNextPage, query]);

  /**
   * Row tap: open the flyer PDF. There is no detail route — the stored OSS url is rewritten
   * onto the custom domain and navigated to, plus posted to the Mini Program inside one. See
   * lib/pdf-viewer.ts; the brochures list uses the same hand-off.
   */
  function onPromotionPress(promotion: Promotion) {
    void openPdf(
      { url: promotion.path, name: promotion.name },
      Boolean(inMiniProgram),
    );
  }

  return {
    companyId,
    setCompany,
    filterOpen,
    setFilterOpen,
    onPromotionPress,
    promotions,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    sentinelRef,
    showLoading: !authReady || query.isLoading,
  };
}
