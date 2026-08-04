/**
 * Cross-cutting utility types (cookies, the WeChat bridge, error reporting) plus the
 * re-exported `Locale`. Shared via `@/types`.
 */

export type { Locale } from "@/i18n/routing";

/** `Set-Cookie` SameSite attribute (lib/cookies.ts). */
export type SameSite = "Lax" | "Strict" | "None";

/** Options for the cookie helpers (lib/cookies.ts). */
export type CookieOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: SameSite;
  secure?: boolean;
};

/** Extra context attached to a captured error (lib/report-error.ts). */
export type ErrorContext = Record<string, unknown>;

/** The `wx.miniProgram` bridge surface available inside a Mini Program web-view. */
export type WxMiniProgram = {
  navigateTo: (opts: { url: string }) => void;
  navigateBack: (opts?: { delta?: number }) => void;
  switchTab: (opts: { url: string }) => void;
  reLaunch: (opts: { url: string }) => void;
  redirectTo: (opts: { url: string }) => void;
  postMessage: (opts: { data: unknown }) => void;
  getEnv: (cb: (res: { miniprogram: boolean }) => void) => void;
};
