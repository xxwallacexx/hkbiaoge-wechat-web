import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CouponPlanSheetScreen } from "./_components/coupon-plan-sheet-screen";

export default async function CouponPlanSheetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // CouponPlanSheetScreen reads `useSearchParams` (planId/sheetId), which requires a
  // Suspense boundary.
  return (
    <Suspense>
      <CouponPlanSheetScreen />
    </Suspense>
  );
}
