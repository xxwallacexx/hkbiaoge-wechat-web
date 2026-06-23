"use client";

import { useEffect } from "react";

import { captureError } from "@/lib/report-error";

// global-error replaces the root layout when it throws, so it must render its own
// <html>/<body> and cannot rely on the i18n provider or Tailwind being loaded.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { digest: error.digest, fatal: true });
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          出错了 · Something went wrong
        </h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          请重试 · Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          重试 · Retry
        </button>
      </body>
    </html>
  );
}
