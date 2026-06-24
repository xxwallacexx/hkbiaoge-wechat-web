"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useInsuranceCompanies } from "@/hooks/use-insurance-companies";
import type { CompanyFilterSheetProps } from "@/types";

/**
 * Bottom-sheet company picker for the brochures filter. Single-select: tapping a company sets
 * the filter; tapping the selected one again clears it. (Same behavior as the plans filter,
 * scoped to the `Brochures` namespace + reusing the shared `useInsuranceCompanies` hook.)
 */
export function CompanyFilterSheet({
  open,
  onClose,
  selectedId,
  onSelect,
}: CompanyFilterSheetProps) {
  const t = useTranslations("Brochures");
  // Only fetch the company list once the sheet is open.
  const { data: companies, isLoading, isError } = useInsuranceCompanies(open);

  return (
    <BottomSheet open={open} onClose={onClose} title={t("chooseCompany")}>
      {isError ? (
        <p className="p-6 text-center text-sm text-destructive">{t("error")}</p>
      ) : isLoading || !companies ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 px-1 pb-2">
          {companies.map((c) => {
            const selected = c._id === selectedId;
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => onSelect(selected ? undefined : c._id)}
                className="truncate rounded-full border-2 px-1 py-2.5 text-center text-sm font-medium transition-colors"
                style={
                  selected
                    ? {
                        backgroundColor: c.bg,
                        borderColor: c.bg,
                        color: "#fff",
                      }
                    : { borderColor: c.bg, color: c.bg }
                }
              >
                {c.realName}
              </button>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}
