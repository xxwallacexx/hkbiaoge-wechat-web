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
//
// jweixin routes EVERY `wx.miniProgram.*` call through
//
//   function O(e){ d && (window.WeixinJSBridge ? e() : addEventListener("WeixinJSBridgeReady", e)) }
//
// `WeixinJSBridgeReady` fires once, early in page load. A script injected later (from a
// React effect, say) registers its listener after that event has already passed, so the
// callback is never invoked and never errors — the call just silently disappears.
const JWEIXIN_SRC = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";

/**
 * Longest we wait on the SDK or the native bridge before falling back. Anything that
 * awaits a WeChat callback needs one of these: a dropped callback is indistinguishable
 * from a slow one, and without a deadline the UI waits forever.
 */
const BRIDGE_TIMEOUT_MS = 2000;

declare global {
  interface Window {
    wx?: { miniProgram?: WxMiniProgram };
    /** Set by WeChat on a web-view page; `"miniprogram"` inside a Mini Program. */
    __wxjs_environment?: string;
  }
}

let loader: Promise<void> | null = null;

/**
 * Wait for the WeChat JS-SDK, injecting it if it is not on the page yet. Resolves
 * immediately on the server.
 *
 * Always resolves, never rejects — callers only care whether `window.wx` showed up, which
 * they check themselves. Settling on failure (rather than rejecting or hanging) is the point:
 * a caller that never learns the SDK is unavailable can never fall back.
 */
export function loadJWeixin(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.wx?.miniProgram) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, BRIDGE_TIMEOUT_MS);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${JWEIXIN_SRC}"]`,
    );
    if (existing) {
      // It may already have finished, and `load` does not fire again for a script that
      // already ran — so check for the SDK before falling back to listening.
      if (window.wx?.miniProgram) return done();
      existing.addEventListener("load", done);
      existing.addEventListener("error", done);
      return;
    }
    const script = document.createElement("script");
    script.src = JWEIXIN_SRC;
    script.async = true;
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  });
  return loader;
}

/** Cheap UA check: is this any WeChat in-app browser? */
export function isWeChat(): boolean {
  if (typeof navigator === "undefined") return false;
  return /micromessenger/i.test(navigator.userAgent);
}

/**
 * Are we in a Mini Program web-view? Answers from signals WeChat exposes on the page
 * itself, with no SDK and no native bridge involved, so it cannot hang or race.
 *
 * `wx.miniProgram.getEnv` is deliberately not the primary check. Its whole body is
 * `cb({miniprogram: "miniprogram" === window.__wxjs_environment})` behind the bridge-ready
 * gate above — it reads the very global consulted below, then risks the callback being
 * dropped on the way back. Reading it directly is both cheaper and strictly more reliable.
 */
export function isMiniProgramSync(): boolean {
  if (typeof window === "undefined") return false;
  if (!isWeChat()) return false;
  // WeChat appends `miniProgram` to the UA inside a web-view, readable on first paint.
  if (/miniprogram/i.test(navigator.userAgent)) return true;
  // Android sets this at document start; on iOS it can land only once the bridge is ready.
  return window.__wxjs_environment === "miniprogram";
}

/**
 * Async form of {@link isMiniProgramSync}, kept for callers that already await it.
 * Falls back to the SDK only when neither synchronous signal is present (older web-views),
 * and bounds that wait so a dropped bridge callback degrades instead of hanging.
 */
export async function isMiniProgram(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!isWeChat()) return false;
  if (isMiniProgramSync()) return true;

  await loadJWeixin();
  const mp = window.wx?.miniProgram;
  if (!mp) return false;
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(
      () => resolve(isMiniProgramSync()),
      BRIDGE_TIMEOUT_MS,
    );
    const settle = (value: boolean) => {
      clearTimeout(timer);
      resolve(value);
    };
    try {
      mp.getEnv((res) => settle(Boolean(res?.miniprogram)));
    } catch {
      settle(false);
    }
  });
}

async function withMiniProgram<T>(
  fn: (mp: WxMiniProgram) => T,
): Promise<T | undefined> {
  if (typeof window === "undefined") return undefined;
  await loadJWeixin();
  const mp = window.wx?.miniProgram;
  if (!mp) return undefined;
  return fn(mp);
}

export const wechat = {
  isWeChat,
  isMiniProgram,
  isMiniProgramSync,
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
