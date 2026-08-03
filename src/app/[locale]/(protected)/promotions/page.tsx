import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PromotionsScreen } from "./_components/promotions-screen";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // PromotionsScreen reads `useSearchParams` (the company filter), which requires a Suspense
  // boundary.
  return (
    <Suspense>
      <PromotionsScreen />
    </Suspense>
  );
}
