import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AnnuityPlanParamScreen } from "./_components/annuity-plan-param-screen";

export default async function AnnuityPlanParamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // The screen reads `useSearchParams` (planId/sheetId), which requires a Suspense boundary.
  return (
    <Suspense>
      <AnnuityPlanParamScreen />
    </Suspense>
  );
}
