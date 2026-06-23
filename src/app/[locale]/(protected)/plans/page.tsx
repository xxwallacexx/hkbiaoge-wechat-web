import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PlansScreen } from "./_components/plans-screen";

export default function PlansPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // PlansScreen reads `useSearchParams`, which requires a Suspense boundary.
  return (
    <Suspense>
      <PlansScreen />
    </Suspense>
  );
}
