"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthToken } from "@/hooks/use-auth-token";
import { api } from "@/lib/api/client";
import type { Promotion } from "@/types";

/** Rows per request, matching the other list screens. */
const PAGE_SIZE = 20;

async function fetchPromotions(
  skip: number,
  companyId: string | undefined,
): Promise<Promotion[]> {
  const res = await api.get("/promotion", {
    params: { skip, limit: PAGE_SIZE, insuranceCompanyId: companyId },
  });
  return (res.data?.data ?? []) as Promotion[];
}

/**
 * Infinite list of promotions, optionally filtered to one insurance company. The API returns a
 * bare array (no total / hasMore), so pagination is offset-based on `skip` and stops on a short
 * page rather than on a fully empty one, saving a round-trip per list. Gated on the auth token
 * being ready (the Bearer is added by lib/api/client).
 */
export function usePromotionsQuery(companyId: string | undefined) {
  const { isAuthenticated } = useAuthToken();

  return useInfiniteQuery({
    queryKey: ["promotions", companyId ?? null],
    enabled: isAuthenticated,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPromotions(pageParam, companyId),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
  });
}
