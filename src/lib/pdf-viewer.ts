/**
 * Opening a PDF from the web-view.
 *
 * A Mini Program `<web-view>` cannot open a document itself — `wx.openDocument` is a
 * native-only API — so inside one we hand the PDF url to the client's native viewer page,
 * which runs `wx.downloadFile` + `wx.openDocument`. Outside the Mini Program (a plain
 * browser) the PDF opens in a new tab.
 *
 * Either way the url is first rewritten onto the custom OSS domain (see lib/oss.ts), so the
 * Mini Program only ever receives a host we own — one entry to allowlist, one place to change.
 *
 * Shared by the brochures and promotions lists (both link straight to a stored PDF instead of
 * to another web screen, so neither needs a detail route of its own) and by the six sheet
 * screens, which generate one first — see hooks/use-sheet-pdf.ts.
 */

import { rewriteOssUrl } from "@/lib/oss";
import { wechat } from "@/lib/wechat";

/**
 * The client-owned native Mini Program page that downloads + displays a PDF. It receives the
 * PDF `url` (+ `name` and `source`) as query params. Set this to the client's actual page route.
 */
export const PDF_VIEWER_PAGE = "/pages/pdf/index";

/**
 * Which list the PDF was opened from, passed straight through to the native viewer page. The
 * three values are the three call sites: a generated plan sheet, a 產品單頁, a 優惠推廣.
 */
export type PdfSource = "plan" | "brochure" | "promotion";

/**
 * The native viewer page url for one PDF. Exported so it can be asserted in tests.
 *
 * Every param is encodeURIComponent-encoded exactly once — see docs/mini-program-pdf-page.md,
 * which is the contract the client's page implements against. NOT `URLSearchParams`: that
 * encodes a space as `+`, and `decodeURIComponent` does not turn `+` back into a space, so a
 * PDF whose url contains a space would be requested under a different OSS key (404) and its
 * title would render with a literal `+`.
 */
export function pdfViewerUrl(
  url: string,
  name: string,
  source: PdfSource,
): string {
  const query = [
    `url=${encodeURIComponent(url)}`,
    `name=${encodeURIComponent(name)}`,
    `source=${encodeURIComponent(source)}`,
  ].join("&");
  return `${PDF_VIEWER_PAGE}?${query}`;
}

/**
 * Display name for a PDF: the last path segment of its url, decoded.
 *
 * Parsed as a url rather than split on "/" for two reasons: a signed OSS url's
 * `?Expires=…&Signature=…` would otherwise end up inside the filename, and a generated plan
 * PDF is keyed by the customer's name, which arrives percent-encoded.
 */
export function pdfFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1));
  } catch {
    return url; // relative or malformed: nothing better to show
  }
}

/**
 * Open a PDF. `inMiniProgram` comes from `useMiniProgram()`, which reports `null` until its
 * async check settles — a tap before then takes the plain-browser path.
 *
 * `source` only travels to the native viewer page; the plain-browser path has no use for it.
 */
export function openPdf(
  { url, name, source }: { url: string; name: string; source: PdfSource },
  inMiniProgram: boolean,
) {
  const target = rewriteOssUrl(url);

  if (inMiniProgram) {
    wechat.navigateTo(pdfViewerUrl(target, name, source));
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}
