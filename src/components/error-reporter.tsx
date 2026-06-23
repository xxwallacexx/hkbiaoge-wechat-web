"use client";

import { useEffect } from "react";

import { captureError } from "@/lib/report-error";

/** Registers global error + unhandledrejection handlers (mounted once in layout). */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) =>
      captureError(e.error ?? e.message, { source: "window.onerror" });
    const onRejection = (e: PromiseRejectionEvent) =>
      captureError(e.reason, { source: "unhandledrejection" });

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
