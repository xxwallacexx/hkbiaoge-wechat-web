import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // zh-CN (Simplified, mainland) + zh-HK (Traditional, Hong Kong) + en.
  locales: ["zh-CN", "zh-HK", "en"],
  defaultLocale: "zh-CN",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
