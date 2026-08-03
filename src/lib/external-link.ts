/**
 * Opening a third-party website from the web-view.
 *
 * A Mini Program `<web-view>` may only load pages on the account's business-domain allowlist,
 * and the `wx.miniProgram` bridge has no "open an arbitrary url" call — so an insurer's own
 * site cannot be navigated to from inside one. There we copy the link instead and let the
 * caller tell the user to paste it into a browser. Outside the Mini Program (a plain browser)
 * the link opens in a new tab.
 *
 * Returns what actually happened so the caller can surface the right message; this module
 * stays locale-agnostic.
 */

export type ExternalLinkResult = "opened" | "copied" | "failed";

/** Clipboard write with a fallback for webviews without the async Clipboard API. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older WeChat webviews (and any insecure context) have no navigator.clipboard.
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

export async function openExternalUrl(
  url: string,
  inMiniProgram: boolean,
): Promise<ExternalLinkResult> {
  if (!url) return "failed";

  if (!inMiniProgram) {
    window.open(url, "_blank", "noopener,noreferrer");
    return "opened";
  }

  return (await copyText(url)) ? "copied" : "failed";
}
