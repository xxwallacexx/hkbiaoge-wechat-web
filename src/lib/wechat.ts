/**
 * WeChat Mini Program `<web-view>` bridge.
 *
 * Inside a Mini Program web-view you can ONLY use the `wx.miniProgram.*` methods
 * (navigation + postMessage). Native `wx.*` APIs (login, pay, scan, ...) are NOT
 * available in a web-view — those must run in native Mini Program pages, which the
 * client owns. Since this site uses its own auth, we don't need them.
 *
 * Outside the Mini Program (a normal browser / H5 surface) every helper degrades
 * to a safe no-op, so the same site also works as a plain web page.
 */

import type { WxMiniProgram } from "@/types";

// Current stable WeChat JS-SDK. (The Mini Program web-view only needs jweixin for
// the `wx.miniProgram` bridge; JSSDK signature config is not required for it.)
const JWEIXIN_SRC = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";

declare global {
  interface Window {
    wx?: { miniProgram?: WxMiniProgram };
  }
}

let loader: Promise<void> | null = null;

/** Inject the WeChat JS-SDK once. Resolves immediately on the server. */
export function loadJWeixin(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.wx?.miniProgram) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${JWEIXIN_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load jweixin")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = JWEIXIN_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load jweixin"));
    document.head.appendChild(script);
  });
  return loader;
}

/** Cheap UA check: is this any WeChat in-app browser? */
export function isWeChat(): boolean {
  if (typeof navigator === "undefined") return false;
  return /micromessenger/i.test(navigator.userAgent);
}

/** Authoritative check via the SDK. Returns false outside a Mini Program web-view. */
export async function isMiniProgram(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isWeChat()) return false;
  await loadJWeixin().catch(() => undefined);
  const mp = window.wx?.miniProgram;
  if (!mp) return false;
  return new Promise<boolean>((resolve) => {
    try {
      mp.getEnv((res) => resolve(Boolean(res?.miniprogram)));
    } catch {
      resolve(false);
    }
  });
}

async function withMiniProgram<T>(
  fn: (mp: WxMiniProgram) => T,
): Promise<T | undefined> {
  if (typeof window === "undefined") return undefined;
  await loadJWeixin().catch(() => undefined);
  const mp = window.wx?.miniProgram;
  if (!mp) return undefined;
  return fn(mp);
}

export const wechat = {
  isWeChat,
  isMiniProgram,
  /** Navigate to a NATIVE Mini Program page the client owns (e.g. a back/host page). */
  navigateTo: (url: string) => withMiniProgram((mp) => mp.navigateTo({ url })),
  navigateBack: (delta = 1) =>
    withMiniProgram((mp) => mp.navigateBack({ delta })),
  switchTab: (url: string) => withMiniProgram((mp) => mp.switchTab({ url })),
  reLaunch: (url: string) => withMiniProgram((mp) => mp.reLaunch({ url })),
  redirectTo: (url: string) => withMiniProgram((mp) => mp.redirectTo({ url })),
  /**
   * Send data back to the Mini Program. IMPORTANT: WeChat does NOT deliver this in
   * real time — the Mini Program only receives it on navigate-back / share /
   * component-destroy. Do not rely on it for live messaging.
   */
  postMessage: (data: unknown) =>
    withMiniProgram((mp) => mp.postMessage({ data })),
};
