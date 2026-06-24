import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SavingPlanSheetScreen } from "./_components/saving-plan-sheet-screen";

export default async function SavingPlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // SavingPlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <SavingPlanSheetScreen />
    </Suspense>
  );
}
