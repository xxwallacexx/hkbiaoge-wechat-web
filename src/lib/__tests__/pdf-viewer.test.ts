import { afterEach, describe, expect, it, vi } from "vitest";

import {
  openPdf,
  PDF_VIEWER_PAGE,
  pdfFileName,
  pdfViewerUrl,
} from "@/lib/pdf-viewer";
import { wechat } from "@/lib/wechat";

const BUCKET_URL =
  "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/assets/a.pdf";
const ALIAS_URL = "https://oss.hkbiaoge.com/assets/a.pdf";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pdfViewerUrl", () => {
  it("encodes the url, name and source as query params", () => {
    expect(
      pdfViewerUrl("https://cdn.example.com/a.pdf", "首季優惠", "promotion"),
    ).toBe(
      `${PDF_VIEWER_PAGE}?url=https%3A%2F%2Fcdn.example.com%2Fa.pdf&name=%E9%A6%96%E5%AD%A3%E5%84%AA%E6%83%A0&source=promotion`,
    );
  });

  // The three values the native page switches on. Spelled out so a renamed literal fails here
  // rather than reaching the client's page as a source it does not recognise.
  it.each(["plan", "brochure", "promotion"] as const)(
    "passes the %s source through verbatim",
    (source) => {
      expect(
        pdfViewerUrl("https://cdn.example.com/a.pdf", "n", source),
      ).toContain(`&source=${source}`);
    },
  );

  // A space must survive as %20, not `+`: the Mini Program decodes the query with
  // decodeURIComponent, which leaves `+` alone — so `+` would request a different OSS
  // object key and render a literal `+` in the title.
  it("survives one decodeURIComponent when the url or name contains a space", () => {
    const url = "https://cdn.example.com/promotions/2026 Q1.pdf";
    const name = "AIA 首季優惠";

    const built = pdfViewerUrl(url, name, "promotion");
    expect(built).toContain("2026%20Q1.pdf");
    expect(built).not.toContain("+");

    const params = built.slice(built.indexOf("?") + 1).split("&");
    const decode = (key: string) =>
      decodeURIComponent(
        params.find((p) => p.startsWith(`${key}=`))!.slice(key.length + 1),
      );
    expect(decode("url")).toBe(url);
    expect(decode("name")).toBe(name);
    expect(decode("source")).toBe("promotion");
  });

  // Characters that are structural in a query string must not leak out of their param —
  // a signed OSS url carries its own `?`, `&`, `=`, `+` and `%`.
  it("keeps a url's own query string inside the url param", () => {
    const url = "https://cdn.example.com/a.pdf?Expires=1&Signature=x+y/z%3D";

    const built = pdfViewerUrl(url, "n", "brochure");
    const params = built.slice(built.indexOf("?") + 1).split("&");

    expect(params).toHaveLength(3); // url=…, name=… and source=…, nothing split off
    expect(decodeURIComponent(params[0].slice("url=".length))).toBe(url);
  });
});

describe("pdfFileName", () => {
  it("takes the last path segment", () => {
    expect(pdfFileName("https://cdn.example.com/pdf/u1/plan.pdf")).toBe(
      "plan.pdf",
    );
  });

  // A signed OSS url carries its own query string; splitting on "/" would keep it.
  it("drops the query string and the fragment", () => {
    expect(
      pdfFileName("https://cdn.example.com/a.pdf?Expires=1&Signature=x#page=2"),
    ).toBe("a.pdf");
  });

  // The generated plan PDF is keyed by the customer's name, so the segment arrives encoded.
  it("decodes a percent-encoded segment", () => {
    expect(
      pdfFileName(
        "https://cdn.example.com/pdf/u1/%E9%99%B3%E5%A4%A7%E6%96%87_USD_5000.pdf",
      ),
    ).toBe("陳大文_USD_5000.pdf");
  });

  it("returns the input when it is not a url", () => {
    expect(pdfFileName("not a url")).toBe("not a url");
  });
});

describe("openPdf", () => {
  it("hands the pdf to the native viewer page inside a Mini Program", () => {
    const navigateTo = vi
      .spyOn(wechat, "navigateTo")
      .mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf(
      {
        url: "https://cdn.example.com/a.pdf",
        name: "優惠",
        source: "promotion",
      },
      true,
    );

    expect(navigateTo).toHaveBeenCalledWith(
      pdfViewerUrl("https://cdn.example.com/a.pdf", "優惠", "promotion"),
    );
    expect(open).not.toHaveBeenCalled();
  });

  it("opens a new tab outside a Mini Program", () => {
    const navigateTo = vi
      .spyOn(wechat, "navigateTo")
      .mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf(
      {
        url: "https://cdn.example.com/a.pdf",
        name: "優惠",
        source: "promotion",
      },
      false,
    );

    expect(open).toHaveBeenCalledWith(
      "https://cdn.example.com/a.pdf",
      "_blank",
      "noopener,noreferrer",
    );
    expect(navigateTo).not.toHaveBeenCalled();
  });

  // The native page only ever sees the custom domain, so that is the single host the client
  // has to put on their downloadFile 合法域名 list. See lib/oss.ts.
  it("hands the native page the rewritten host, not the bucket host", () => {
    const navigateTo = vi
      .spyOn(wechat, "navigateTo")
      .mockResolvedValue(undefined);

    openPdf({ url: BUCKET_URL, name: "優惠", source: "brochure" }, true);

    expect(navigateTo).toHaveBeenCalledWith(
      pdfViewerUrl(ALIAS_URL, "優惠", "brochure"),
    );
    expect(navigateTo.mock.calls[0][0]).not.toContain("aliyuncs");
  });

  it("opens the rewritten url in the new tab too", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf({ url: BUCKET_URL, name: "優惠", source: "brochure" }, false);

    expect(open).toHaveBeenCalledWith(
      ALIAS_URL,
      "_blank",
      "noopener,noreferrer",
    );
  });

  // The generated sheet PDF only exists once the request resolves, so this call happens after
  // an await. Opening exactly one tab then — rather than pre-opening a blank one in the tap
  // handler — is deliberate; see hooks/use-sheet-pdf.ts.
  it("opens exactly one tab per call", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    openPdf({ url: BUCKET_URL, name: "優惠", source: "brochure" }, false);

    expect(open).toHaveBeenCalledTimes(1);
  });
});
