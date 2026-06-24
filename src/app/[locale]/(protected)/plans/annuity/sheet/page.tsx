import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AnnuityPlanSheetScreen } from "./_components/annuity-plan-sheet-screen";

export default async function AnnuityPlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // AnnuityPlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a Suspense
  // boundary.
  return (
    <Suspense>
      <AnnuityPlanSheetScreen />
    </Suspense>
  );
}
