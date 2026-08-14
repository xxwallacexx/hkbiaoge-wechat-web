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
 * PDF `url` (+ `name`, `source` and, for a generated sheet, the optional `PdfMeta` params) as
 * query params. Set this to the client's actual page route.
 */
export const PDF_VIEWER_PAGE = "/pages/pdf/index";

/**
 * Which list the PDF was opened from, passed straight through to the native viewer page. The
 * three values are the three call sites: a generated plan sheet, a 產品單頁, a 優惠推廣.
 */
export type PdfSource = "plan" | "brochure" | "promotion";

/**
 * The sheet's own facts, carried alongside the url so the native viewer page can say who the
 * document is for. Sheet-only: a 產品單頁 / 優惠推廣 belongs to no customer, so both list
 * screens pass nothing and their urls stay exactly as they were.
 *
 * Each key is named after the field it comes from — `period` and `currency` off the param
 * form, `instal` and `amount` off `PlanCal`. `customerName` is the one rename: the form field
 * is `name`, but `name` is already this url's PDF-title param, which the client's page reads
 * as the saved filename (docs/mini-program-pdf-page.md §1, §3).
 *
 * All optional, because a screen builds this above its own loading gate (hook order has to be
 * identical on every render) and an annuity GENERAL sheet never loads a `cal` at all.
 */
export type PdfMeta = {
  /** 客户姓名 — form field `name`, off the sheet's basicInfo / personalInfo. */
  customerName?: string;
  /** 产品名称 — the plan's own `name`, i.e. what `SheetHeader` shows as the title. */
  planName?: string;
  /** 保费金额 — `cal.instal`, the premium the sheet was actually generated at. */
  instal?: string;
  /** 名義金額 — `cal.amount`; annuity GENERAL has no cal and passes its entered amount. */
  amount?: string;
  /** 币种 — form field `currency`. */
  currency?: string;
  /** 年期 — form field `period`. Stringified by the caller; saving's is a number. */
  period?: string;
};

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
  meta: PdfMeta = {},
): string {
  const query = [
    `url=${encodeURIComponent(url)}`,
    `name=${encodeURIComponent(name)}`,
    `source=${encodeURIComponent(source)}`,
    // Spelled out rather than looped over `meta`, so the param order is the order here
    // whatever order a call site happens to write the object in — six sheet screens building
    // six different urls for the same data would make the example in the doc a lie.
    metaParam("customerName", meta.customerName),
    metaParam("planName", meta.planName),
    metaParam("instal", meta.instal),
    metaParam("amount", meta.amount),
    metaParam("currency", meta.currency),
    metaParam("period", meta.period),
  ]
    .filter(Boolean)
    .join("&");
  return `${PDF_VIEWER_PAGE}?${query}`;
}

/**
 * One optional `key=value` pair. An absent or empty value yields "" and is filtered out, so
 * the param is missing rather than present-and-empty — the page's own `if (!value)` checks then
 * behave the same either way, and it is never the string "undefined".
 */
function metaParam(key: string, value?: string): string {
  return value ? `${key}=${encodeURIComponent(value)}` : "";
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
 * `source` and `meta` only travel to the native viewer page; the plain-browser path has no
 * use for either.
 */
export function openPdf(
  {
    url,
    name,
    source,
    meta,
  }: { url: string; name: string; source: PdfSource; meta?: PdfMeta },
  inMiniProgram: boolean,
) {
  const target = rewriteOssUrl(url);

  if (inMiniProgram) {
    wechat.navigateTo(pdfViewerUrl(target, name, source, meta));
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}
