import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ErrorReporter } from "@/components/error-reporter";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import type { Locale } from "@/types";

import "../globals.css";

export const metadata: Metadata = {
  title: "HKBiaoge",
  description: "Insurance plans — WeChat Mini Program web-view",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  // Enable static rendering for this locale.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <ErrorReporter />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
