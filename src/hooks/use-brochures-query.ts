"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthToken } from "@/hooks/use-auth-token";
import { api } from "@/lib/api/client";
import { PAGE_SIZE } from "@/lib/brochures";
import type { Brochure, BrochuresQueryParams } from "@/types";

async function fetchBrochures(
  handbookType: string,
  skip: number,
  search: string,
  companyId: string | undefined,
): Promise<Brochure[]> {
  const res = await api.get("/handbook", {
    params: {
      skip,
      limit: PAGE_SIZE,
      handbookType,
      search: search || undefined,
      insuranceCompanyId: companyId,
    },
  });
  return (res.data?.data ?? []) as Brochure[];
}

/**
 * Infinite list of brochures (handbooks) for the active category. All categories share the
 * `/handbook` endpoint, filtered by `handbookType`. The API returns a bare array (no
 * total/hasMore), so pagination is offset-based on `skip` and stops on a short page. Gated on
 * the auth token being ready (the Bearer is added by lib/api/client).
 */
export function useBrochuresQuery({
  tab,
  search,
  companyId,
}: BrochuresQueryParams) {
  const { isAuthenticated } = useAuthToken();

  return useInfiniteQuery({
    queryKey: ["brochures", tab.key, search, companyId ?? null],
    enabled: isAuthenticated,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchBrochures(tab.key, pageParam, search, companyId),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
  });
}
