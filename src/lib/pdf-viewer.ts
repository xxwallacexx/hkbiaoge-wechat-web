/**
 * Opening a PDF from the web-view.
 *
 * A Mini Program `<web-view>` cannot open a document itself — `wx.openDocument` is a
 * native-only API — so inside one we hand the PDF url to the client's native viewer page,
 * which runs `wx.downloadFile` + `wx.openDocument`. Outside the Mini Program (a plain
 * browser) the PDF opens in a new tab.
 *
 * Shared by the brochures and promotions lists: both link straight to a PDF instead of to
 * another web screen, so neither needs a detail route of its own.
 */

import { wechat } from "@/lib/wechat";

/**
 * The client-owned native Mini Program page that downloads + displays a PDF. It receives the
 * PDF `url` (+ `name`) as query params. Set this to the client's actual page route.
 */
export const PDF_VIEWER_PAGE = "/pages/pdf/index";

/**
 * The native viewer page url for one PDF. Exported so it can be asserted in tests.
 *
 * Both params are encodeURIComponent-encoded exactly once — see docs/mini-program-pdf-page.md,
 * which is the contract the client's page implements against. NOT `URLSearchParams`: that
 * encodes a space as `+`, and `decodeURIComponent` does not turn `+` back into a space, so a
 * PDF whose url contains a space would be requested under a different OSS key (404) and its
 * title would render with a literal `+`.
 */
export function pdfViewerUrl(url: string, name: string): string {
  const query = `url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
  return `${PDF_VIEWER_PAGE}?${query}`;
}

/**
 * Open a PDF. `inMiniProgram` comes from `useMiniProgram()`, which reports `null` until its
 * async check settles — a tap before then takes the plain-browser path.
 */
export function openPdf(
  { url, name }: { url: string; name: string },
  inMiniProgram: boolean,
) {
  if (inMiniProgram) {
    wechat.navigateTo(pdfViewerUrl(url, name));
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
