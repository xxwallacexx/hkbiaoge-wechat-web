import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SavingPlanParamScreen } from "./_components/saving-plan-param-screen";

export default async function SavingPlanParamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // SavingPlanParamScreen reads `useSearchParams` (planId/sheetId), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <SavingPlanParamScreen />
    </Suspense>
  );
}
