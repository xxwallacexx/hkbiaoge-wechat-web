import { getRequestConfig } from "next-intl/server";

import { composeMessages } from "./compose-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as never)) {
    locale = routing.defaultLocale;
  }

  const raw = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: composeMessages(raw),
  };
});
