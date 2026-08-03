import { afterEach, describe, expect, it, vi } from "vitest";

import { openPdf, PDF_VIEWER_PAGE, pdfViewerUrl } from "@/lib/pdf-viewer";
import { wechat } from "@/lib/wechat";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pdfViewerUrl", () => {
  it("encodes the url and name as query params", () => {
    expect(pdfViewerUrl("https://cdn.example.com/a.pdf", "首季優惠")).toBe(
      `${PDF_VIEWER_PAGE}?url=https%3A%2F%2Fcdn.example.com%2Fa.pdf&name=%E9%A6%96%E5%AD%A3%E5%84%AA%E6%83%A0`,
    );
  });

  // A space must survive as %20, not `+`: the Mini Program decodes the query with
  // decodeURIComponent, which leaves `+` alone — so `+` would request a different OSS
  // object key and render a literal `+` in the title.
  it("survives one decodeURIComponent when the url or name contains a space", () => {
    const url = "https://cdn.example.com/promotions/2026 Q1.pdf";
    const name = "AIA 首季優惠";

    const built = pdfViewerUrl(url, name);
    expect(built).toContain("2026%20Q1.pdf");
    expect(built).not.toContain("+");

    const params = built.slice(built.indexOf("?") + 1).split("&");
    const decode = (key: string) =>
      decodeURIComponent(
        params.find((p) => p.startsWith(`${key}=`))!.slice(key.length + 1),
      );
    expect(decode("url")).toBe(url);
    expect(decode("name")).toBe(name);
  });

  // Characters that are structural in a query string must not leak out of their param —
  // a signed OSS url carries its own `?`, `&`, `=`, `+` and `%`.
  it("keeps a url's own query string inside the url param", () => {
    const url = "https://cdn.example.com/a.pdf?Expires=1&Signature=x+y/z%3D";

    const built = pdfViewerUrl(url, "n");
    const params = built.slice(built.indexOf("?") + 1).split("&");

    expect(params).toHaveLength(2); // url=… and name=…, nothing split off
    expect(decodeURIComponent(params[0].slice("url=".length))).toBe(url);
  });
});

describe("openPdf", () => {
  it("hands the pdf to the native viewer page inside a Mini Program", () => {
    const navigateTo = vi
      .spyOn(wechat, "navigateTo")
      .mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf({ url: "https://cdn.example.com/a.pdf", name: "優惠" }, true);

    expect(navigateTo).toHaveBeenCalledWith(
      pdfViewerUrl("https://cdn.example.com/a.pdf", "優惠"),
    );
    expect(open).not.toHaveBeenCalled();
  });

  it("opens a new tab outside a Mini Program", () => {
    const navigateTo = vi
      .spyOn(wechat, "navigateTo")
      .mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf({ url: "https://cdn.example.com/a.pdf", name: "優惠" }, false);

    expect(open).toHaveBeenCalledWith(
      "https://cdn.example.com/a.pdf",
      "_blank",
      "noopener,noreferrer",
    );
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
