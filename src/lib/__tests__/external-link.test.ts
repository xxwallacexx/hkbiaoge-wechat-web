import { afterEach, describe, expect, it, vi } from "vitest";

import { openExternalUrl } from "@/lib/external-link";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const URL_ = "https://example.com/fulfillment-ratio";

describe("openExternalUrl", () => {
  it("opens a new tab outside a Mini Program", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    await expect(openExternalUrl(URL_, false)).resolves.toBe("opened");
    expect(open).toHaveBeenCalledWith(URL_, "_blank", "noopener,noreferrer");
  });

  it("copies the link instead inside a Mini Program", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    await expect(openExternalUrl(URL_, true)).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(URL_);
    // A web-view must never try to navigate to a non-allowlisted domain.
    expect(open).not.toHaveBeenCalled();
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    const exec = vi.fn().mockReturnValue(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand = exec;

    await expect(openExternalUrl(URL_, true)).resolves.toBe("copied");
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("reports failure when the link cannot be copied", async () => {
    vi.stubGlobal("navigator", {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand = vi.fn().mockReturnValue(false);

    await expect(openExternalUrl(URL_, true)).resolves.toBe("failed");
  });

  it("reports failure for a missing url", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    await expect(openExternalUrl("", false)).resolves.toBe("failed");
    expect(open).not.toHaveBeenCalled();
  });
});
