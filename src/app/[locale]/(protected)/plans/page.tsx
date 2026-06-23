import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PlansScreen } from "./_components/plans-screen";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // PlansScreen reads `useSearchParams`, which requires a Suspense boundary.
  return (
    <Suspense>
      <PlansScreen />
    </Suspense>
  );
}
