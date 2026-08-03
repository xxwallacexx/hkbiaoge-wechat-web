"use client";

import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { InsuranceCompanyDetail } from "@/types";

/**
 * One company tile: the company's own colour as the background, its full name, and a link
 * button per url it has. Both urls are optional on the API, so a button is rendered only
 * when its link exists rather than shown dead.
 */
export function InsuranceCompanyCard({
  company,
  onOpenUrl,
}: {
  company: InsuranceCompanyDetail;
  onOpenUrl: (url: string) => void;
}) {
  const t = useTranslations("InsuranceCompanies");

  return (
    <div
      className="flex flex-col items-center gap-2.5 rounded-xl border border-slate-400/40 p-4"
      style={{ backgroundColor: company.bg || "#64748b" }}
    >
      <p className="line-clamp-2 text-center text-base font-bold text-white md:text-lg">
        {company.realName || company.name}
      </p>
      {/* Buttons hug the name rather than the bottom of the tile: grid rows stretch to the
          tallest card, and pinning them down left a gap mid-card for companies with fewer
          links. */}
      <div className="flex w-full flex-col gap-2">
        {company.officialWebsiteUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => onOpenUrl(company.officialWebsiteUrl!)}
          >
            <Link2 className="h-3.5 w-3.5" />
            {t("website")}
          </Button>
        )}
        {company.fulfillmentRatioUrl && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => onOpenUrl(company.fulfillmentRatioUrl!)}
          >
            <Link2 className="h-3.5 w-3.5" />
            {t("fulfillmentRatio")}
          </Button>
        )}
      </div>
    </div>
  );
}
