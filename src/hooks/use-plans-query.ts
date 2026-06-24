"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthToken } from "@/hooks/use-auth-token";
import { api } from "@/lib/api/client";
import { PAGE_SIZE } from "@/lib/plans";
import type { PlanOverview, PlansQueryParams } from "@/types";

async function fetchPlans(
  endpoint: string,
  skip: number,
  search: string,
  companyId: string | undefined,
): Promise<PlanOverview[]> {
  const res = await api.get(endpoint, {
    params: {
      skip,
      limit: PAGE_SIZE,
      search: search || undefined,
      // Web surface: include plans flagged `isHiddenInsideApp`.
      isWebOnly: true,
      insuranceCompanyId: companyId,
    },
  });
  return (res.data?.data ?? []) as PlanOverview[];
}

/**
 * Infinite list of insurance plans for the active tab. The API returns a bare array
 * (no total/hasMore), so pagination is offset-based on `skip` and stops on a short
 * page. Gated on the auth token being ready (each request needs the Bearer JWT, added
 * by lib/api.ts).
 */
export function usePlansQuery({ tab, search, companyId }: PlansQueryParams) {
  const { isAuthenticated } = useAuthToken();

  return useInfiniteQuery({
    queryKey: ["plans", tab.key, search, companyId ?? null],
    enabled: isAuthenticated,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchPlans(tab.endpoint, pageParam, search, companyId),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.flat().length,
  });
}
