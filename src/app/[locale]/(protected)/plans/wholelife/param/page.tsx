import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { WholelifePlanParamScreen } from "./_components/wholelife-plan-param-screen";

export default async function WholelifePlanParamPage({
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
      <WholelifePlanParamScreen />
    </Suspense>
  );
}
