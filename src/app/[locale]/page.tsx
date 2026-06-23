import { setRequestLocale } from "next-intl/server";

import { EmbeddedDemo } from "./_components/embedded-demo";

export default function Home({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return <EmbeddedDemo />;
}
