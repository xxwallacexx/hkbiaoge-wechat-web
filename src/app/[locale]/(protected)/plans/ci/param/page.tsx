import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CiPlanParamScreen } from "./_components/ci-plan-param-screen";

export default async function CiPlanParamPage({
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
      <CiPlanParamScreen />
    </Suspense>
  );
}
