import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SheetSyncScreen } from "./_components/sheet-sync-screen";

export default async function SheetSyncPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // SheetSyncScreen reads `useSearchParams` (planId/destination), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <SheetSyncScreen />
    </Suspense>
  );
}
