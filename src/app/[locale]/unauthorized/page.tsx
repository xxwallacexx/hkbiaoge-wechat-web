import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function UnauthorizedPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Unauthorized");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="max-w-sm text-muted-foreground">{t("description")}</p>
    </main>
  );
}
