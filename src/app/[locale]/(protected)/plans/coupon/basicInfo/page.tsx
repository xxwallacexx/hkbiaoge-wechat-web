import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CouponPlanBasicInfoScreen } from "./_components/coupon-plan-basic-info-screen";

export default async function CouponPlanBasicInfoPage({
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
      <CouponPlanBasicInfoScreen />
    </Suspense>
  );
}
