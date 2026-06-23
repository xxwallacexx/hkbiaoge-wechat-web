import { env } from "@/lib/env";
import type { ErrorContext } from "@/types";

/**
 * Central error sink. Logs to console always, and POSTs to
 * `NEXT_PUBLIC_ERROR_REPORT_URL` when configured — useful in a web-view where you
 * can't open devtools. Swap the network body for Sentry/Datadog when ready.
 * Never throws.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  // eslint-disable-next-line no-console
  console.error("[captureError]", error, context);

  if (typeof window === "undefined") return;
  const url = env.NEXT_PUBLIC_ERROR_REPORT_URL;
  if (!url) return;

  try {
    const payload = JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      url: window.location.href,
      ua: navigator.userAgent,
      ts: Date.now(),
    });
    // sendBeacon survives page unloads (handy in a web-view).
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
    } else {
      void fetch(url, { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    // never throw from the reporter
  }
}
