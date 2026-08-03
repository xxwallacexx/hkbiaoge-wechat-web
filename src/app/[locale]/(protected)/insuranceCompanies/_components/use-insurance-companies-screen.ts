"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthToken } from "@/hooks/use-auth-token";
import { useInsuranceCompanies } from "@/hooks/use-insurance-companies";
import { useMiniProgram } from "@/hooks/use-mini-program";
import { openExternalUrl } from "@/lib/external-link";

/**
 * Data + link handling for the insurance-companies screen. `GET /insuranceCompany` returns
 * every company in one response, so this is a plain cached query with no pagination, no
 * filter and no URL state — the screen is read-only. `InsuranceCompaniesScreen` consumes
 * this and only renders.
 */
export function useInsuranceCompaniesScreen() {
  const t = useTranslations("InsuranceCompanies");
  const { ready: authReady } = useAuthToken();
  const inMiniProgram = useMiniProgram();
  const { data: companies, isLoading, isError } = useInsuranceCompanies();

  /**
   * Open a company's website. Inside the Mini Program the link can only be copied — its
   * domain is not on the web-view allowlist — so tell the user what happened either way.
   */
  async function onOpenUrl(url: string) {
    const result = await openExternalUrl(url, Boolean(inMiniProgram));
    if (result === "copied") toast.success(t("linkCopied"));
    if (result === "failed") toast.error(t("linkFailed"));
  }

  return {
    companies: companies ?? [],
    isError,
    onOpenUrl,
    showLoading: !authReady || isLoading,
  };
}
