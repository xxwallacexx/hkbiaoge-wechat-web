"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthToken } from "@/hooks/use-auth-token";
import { api } from "@/lib/api/client";
import type { InsuranceCompanyDetail } from "@/types";

/**
 * The full insurance-company list for the filter sheet. The endpoint returns every
 * company at once (no pagination), so a plain cached query is enough. Pass
 * `enabled: false` to defer the fetch until the filter is actually opened.
 */
export function useInsuranceCompanies(enabled = true) {
  const { isAuthenticated } = useAuthToken();

  return useQuery({
    queryKey: ["insuranceCompanies"],
    enabled: enabled && isAuthenticated,
    staleTime: 5 * 60_000, // companies rarely change
    queryFn: async () => {
      const res = await api.get("/insuranceCompany");
      return (res.data?.data ?? []) as InsuranceCompanyDetail[];
    },
  });
}
