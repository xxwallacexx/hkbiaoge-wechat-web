import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { UnitLinkedPlanSheetScreen } from "./_components/unit-linked-plan-sheet-screen";

export default async function UnitLinkedPlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // UnitLinkedPlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <UnitLinkedPlanSheetScreen />
    </Suspense>
  );
}
