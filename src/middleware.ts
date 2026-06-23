import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Localize everything except /api, /healthz, Next internals, and files with an
  // extension (so the WeChat verification .txt at the root is served as-is).
  matcher: ["/((?!api|healthz|_next|_vercel|.*\\..*).*)"],
};
