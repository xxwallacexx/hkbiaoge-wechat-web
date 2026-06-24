import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { BrochuresScreen } from "./_components/brochures-screen";

export default async function BrochuresPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // BrochuresScreen reads `useSearchParams` (tab/search/company), which requires a Suspense
  // boundary.
  return (
    <Suspense>
      <BrochuresScreen />
    </Suspense>
  );
}
