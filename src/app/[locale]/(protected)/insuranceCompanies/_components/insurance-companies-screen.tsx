"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { InsuranceCompanyCard } from "./insurance-company-card";
import { useInsuranceCompaniesScreen } from "./use-insurance-companies-screen";

/**
 * The insurance-companies (保險公司) screen: a grid of company tiles, each linking to that
 * company's website and fulfilment-ratio page. All data and link handling lives in
 * `useInsuranceCompaniesScreen`; this component is presentation only. The simplest screen in
 * the app — one un-paginated request, no filter, no search.
 */
export function InsuranceCompaniesScreen() {
  const t = useTranslations("InsuranceCompanies");
  const { companies, isError, onOpenUrl, showLoading } =
    useInsuranceCompaniesScreen();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="bg-gradient-to-b from-primary to-primary/90 px-4 py-3 text-primary-foreground">
        <div className="flex min-h-11 items-center justify-center">
          <h1 className="truncate text-xl font-bold md:text-2xl">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        {isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            {t("error")}
          </p>
        ) : showLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {companies.map((company) => (
              <InsuranceCompanyCard
                key={company._id}
                company={company}
                onOpenUrl={onOpenUrl}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
