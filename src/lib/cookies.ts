/**
 * Minimal first-party cookie helpers (no dependency).
 *
 * These set/read a JS-readable cookie on the SITE's own domain. The token is then
 * attached to API calls as an `Authorization` header (see lib/api.ts), so it works
 * even when the API is on a different origin — WeChat's web-view blocks cross-site
 * cookies, so we never rely on the browser to auto-send the cookie to the API.
 */

import type { CookieOptions } from "@/types";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + escaped + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  if (typeof document === "undefined") return;
  const {
    maxAgeSeconds,
    path = "/",
    sameSite = "Lax",
    // Secure is required on https (and mandatory for SameSite=None). Skip it on
    // http://localhost so cookies still work in local dev.
    secure = typeof location !== "undefined" && location.protocol === "https:",
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (typeof maxAgeSeconds === "number") {
    cookie += `; Max-Age=${Math.floor(maxAgeSeconds)}`;
  }
  if (secure || sameSite === "None") {
    cookie += "; Secure";
  }
  document.cookie = cookie;
}

export function removeCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax`;
}
