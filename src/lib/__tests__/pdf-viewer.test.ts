import { afterEach, describe, expect, it, vi } from "vitest";

import { navigation, openPdf, pdfMessage } from "@/lib/pdf-viewer";
import { wechat } from "@/lib/wechat";

const BUCKET_URL =
  "https://chartermax-dev.oss-cn-hongkong.aliyuncs.com/assets/a.pdf";
const ALIAS_URL = "https://oss.hkbiaoge.com/assets/a.pdf";

/** Stub every exit from the page: the bridge, the new tab, and same-window navigation. */
function stubExits() {
  return {
    postMessage: vi.spyOn(wechat, "postMessage").mockResolvedValue(undefined),
    open: vi.spyOn(window, "open").mockReturnValue(null),
    assign: vi.spyOn(navigation, "assign").mockImplementation(() => {}),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pdfMessage", () => {
  it("carries the url and name under a discriminated type", () => {
    expect(pdfMessage(ALIAS_URL, "首季優惠")).toEqual({
      type: "openPdf",
      url: ALIAS_URL,
      name: "首季優惠",
    });
  });
});

describe("openPdf", () => {
  it("navigates to the PDF and posts it to the Mini Program inside one", async () => {
    const { postMessage, assign, open } = stubExits();

    await openPdf({ url: BUCKET_URL, name: "優惠" }, true);

    expect(postMessage).toHaveBeenCalledWith(pdfMessage(ALIAS_URL, "優惠"));
    expect(assign).toHaveBeenCalledWith(ALIAS_URL);
    // A web-view has no tabs to open.
    expect(open).not.toHaveBeenCalled();
  });

  // WeChat only flushes buffered messages when the web-view is destroyed or navigated back
  // from, so posting after `assign` could be dropped along with the document.
  it("posts before it navigates away", async () => {
    const order: string[] = [];
    vi.spyOn(wechat, "postMessage").mockImplementation(async () => {
      order.push("post");
    });
    vi.spyOn(navigation, "assign").mockImplementation(() => {
      order.push("assign");
    });

    await openPdf({ url: BUCKET_URL, name: "優惠" }, true);

    expect(order).toEqual(["post", "assign"]);
  });

  it("opens a new tab outside a Mini Program, and posts nothing", async () => {
    const { postMessage, assign, open } = stubExits();

    await openPdf({ url: BUCKET_URL, name: "優惠" }, false);

    expect(open).toHaveBeenCalledWith(
      ALIAS_URL,
      "_blank",
      "noopener,noreferrer",
    );
    expect(postMessage).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  // The new tab has to be requested while the click is still the current task, or the browser
  // treats it as an unsolicited popup and blocks it.
  it("opens the new tab synchronously, before awaiting", () => {
    const { open } = stubExits();

    void openPdf({ url: BUCKET_URL, name: "優惠" }, false);

    expect(open).toHaveBeenCalledTimes(1);
  });

  it("passes a url on a host with no alias through unchanged", async () => {
    const { assign, postMessage } = stubExits();
    const url = "https://cdn.example.com/a.pdf";

    await openPdf({ url, name: "優惠" }, true);

    expect(assign).toHaveBeenCalledWith(url);
    expect(postMessage).toHaveBeenCalledWith(pdfMessage(url, "優惠"));
  });
});
