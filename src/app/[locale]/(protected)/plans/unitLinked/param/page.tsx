import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { UnitLinkedPlanParamScreen } from "./_components/unit-linked-plan-param-screen";

export default async function UnitLinkedPlanParamPage({
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
      <UnitLinkedPlanParamScreen />
    </Suspense>
  );
}
