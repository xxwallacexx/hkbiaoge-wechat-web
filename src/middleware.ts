import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Locale-stripped paths served from the (protected) route group. Route groups are not
// part of the URL, so we guard the real path(s).
const PROTECTED_PATHS = ["/plans"];

const locales = routing.locales as readonly string[];

/** Strip a leading `/<locale>` so the path can be matched against PROTECTED_PATHS. */
function innerPath(pathname: string): string {
  const [, maybeLocale, ...rest] = pathname.split("/");
  return locales.includes(maybeLocale) ? "/" + rest.join("/") : pathname;
}

function localeOf(pathname: string): string {
  const maybeLocale = pathname.split("/")[1];
  return locales.includes(maybeLocale) ? maybeLocale : routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const inner = innerPath(pathname);
  const isProtected = PROTECTED_PATHS.some(
    (p) => inner === p || inner.startsWith(p + "/"),
  );

  if (isProtected) {
    const hasToken = request.cookies.has("wv_token");
    // The token is written client-side after the `?code=` exchange, so a fresh
    // Mini-Program hand-off has no cookie yet — let it through and let the page run
    // the exchange. Only block when there's no token AND no hand-off in progress.
    const authInProgress = searchParams.has("code");
    if (!hasToken && !authInProgress) {
      const url = request.nextUrl.clone();
      url.pathname = `/${localeOf(pathname)}/unauthorized`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Localize everything except /api, /healthz, Next internals, and files with an
  // extension (so the WeChat verification .txt at the root is served as-is).
  matcher: ["/((?!api|healthz|_next|_vercel|.*\\..*).*)"],
};
