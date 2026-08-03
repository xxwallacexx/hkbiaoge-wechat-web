import { setRequestLocale } from "next-intl/server";

import { InsuranceCompaniesScreen } from "./_components/insurance-companies-screen";

export default async function InsuranceCompaniesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  // No Suspense boundary needed here: unlike the other list screens this one reads no
  // search params.
  return <InsuranceCompaniesScreen />;
}
