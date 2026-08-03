import { afterEach, describe, expect, it, vi } from "vitest";

import { openPdf, PDF_VIEWER_PAGE, pdfViewerUrl } from "@/lib/pdf-viewer";
import { wechat } from "@/lib/wechat";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pdfViewerUrl", () => {
  it("encodes the url and name as query params", () => {
    expect(pdfViewerUrl("https://cdn.example.com/a b.pdf", "首季優惠")).toBe(
      `${PDF_VIEWER_PAGE}?url=https%3A%2F%2Fcdn.example.com%2Fa+b.pdf&name=%E9%A6%96%E5%AD%A3%E5%84%AA%E6%83%A0`,
    );
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
