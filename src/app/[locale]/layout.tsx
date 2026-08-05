import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ErrorReporter } from "@/components/error-reporter";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { JWEIXIN_SRC } from "@/lib/wechat";
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
        {/*
          Must run before hydration, not from an effect: jweixin only receives
          `WeixinJSBridgeReady` if its listener is registered before WeChat fires that
          event, and WeChat fires it once, early. Injected late, every `wx.miniProgram.*`
          call is silently dropped — see the note at JWEIXIN_SRC. Loaded unconditionally
          because the UA is unavailable in this statically-prerendered layout; it is a
          13KB request that plain browsers simply never use.

          A plain `<script async>` rather than next/script: React hoists this into <head>
          as a real tag in the initial HTML, whereas `strategy="beforeInteractive"` is only
          honoured in a true root layout — there is none here (this file is under
          app/[locale]/), so it silently degrades to Next's deferred __next_s queue and
          runs after the framework boots, which is the timing we are trying to beat.
        */}
        <script src={JWEIXIN_SRC} async />
        <ErrorReporter />
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
