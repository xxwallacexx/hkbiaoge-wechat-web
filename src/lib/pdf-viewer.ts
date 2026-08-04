/**
 * Opening a PDF from the web-view.
 *
 * Brochures and promotions both link straight to a PDF on Alibaba OSS instead of to another
 * web screen, so neither needs a detail route — tapping a row opens the document itself.
 *
 * The url the API returns sits on the bucket's shared `*.oss-cn-hongkong.aliyuncs.com` host,
 * which cannot be verified as a WeChat 业务域名. `rewriteOssUrl` swaps it for the custom domain
 * aliased onto the same bucket, which can be (see lib/oss.ts). With the document on an allowed
 * domain there is a single path for both environments — navigate to the PDF — and inside a
 * Mini Program we additionally hand the url + name back over the `wx.miniProgram` bridge so the
 * native side knows which document was opened. See docs/mini-program-pdf-handoff.md.
 */

import { rewriteOssUrl } from "@/lib/oss";
import { wechat } from "@/lib/wechat";
import type { PdfMessage } from "@/types";

/** The payload posted to the Mini Program. Exported so it can be asserted in tests. */
export function pdfMessage(url: string, name: string): PdfMessage {
  return { type: "openPdf", url, name };
}

/**
 * Same-window navigation, behind an object so tests can stand in for it — jsdom implements
 * `window.location`'s methods as unforgeable, so they cannot be spied on directly.
 *
 * NOT `window.open(url, "_self")`: an Android WebView with multiple windows disabled returns
 * null from `window.open` without navigating anywhere.
 */
export const navigation = {
  assign: (url: string) => window.location.assign(url),
};

/**
 * Open a PDF. `inMiniProgram` comes from `useMiniProgram()`, which reports `null` until its
 * async check settles — a tap before then takes the plain-browser path.
 */
export async function openPdf(
  { url, name }: { url: string; name: string },
  inMiniProgram: boolean,
): Promise<void> {
  const target = rewriteOssUrl(url);

  if (!inMiniProgram) {
    // Runs before the first `await`, so it still counts as user-activated and the browser
    // does not treat the new tab as a blocked popup.
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  // Post before navigating. WeChat buffers messages and only delivers them when the web-view
  // is destroyed or navigated back from, so the call has to happen while this document is
  // still alive — after `assign` it may never run.
  await wechat.postMessage(pdfMessage(target, name));
  navigation.assign(target);
}
