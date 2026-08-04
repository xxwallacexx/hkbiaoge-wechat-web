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

/**
 * What the site posts to the Mini Program when the user opens a document (lib/pdf-viewer.ts).
 * `type` is a discriminator: WeChat hands its `bindmessage` handler every buffered message at
 * once, so the Mini Program has to tell ours apart from any other payload.
 */
export type PdfMessage = {
  type: "openPdf";
  url: string; // absolute https url of the PDF, already on the custom OSS domain
  name: string; // the document's display title
};

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
