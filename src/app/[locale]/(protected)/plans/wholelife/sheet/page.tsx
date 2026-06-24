import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { WholelifePlanSheetScreen } from "./_components/wholelife-plan-sheet-screen";

export default async function WholelifePlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // WholelifePlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <WholelifePlanSheetScreen />
    </Suspense>
  );
}
