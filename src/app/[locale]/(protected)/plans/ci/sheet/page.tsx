import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CiPlanSheetScreen } from "./_components/ci-plan-sheet-screen";

export default async function CiPlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // CiPlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a Suspense
  // boundary.
  return (
    <Suspense>
      <CiPlanSheetScreen />
    </Suspense>
  );
}
