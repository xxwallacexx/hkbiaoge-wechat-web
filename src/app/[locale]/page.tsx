import { setRequestLocale } from "next-intl/server";

import { EmbeddedDemo } from "./_components/embedded-demo";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EmbeddedDemo />;
}
