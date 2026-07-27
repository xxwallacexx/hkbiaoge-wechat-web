import { NextResponse } from "next/server";

// Liveness/readiness probe for Cloud Run. Excluded from the i18n proxy.
//
// Deliberately NOT /healthz: Google Frontend intercepts that exact path on
// *.run.app and returns its own 404, so the request never reaches the container.
// Verified against three unrelated Cloud Run services — /healthz returns an
// identical Google error page (content-length 1568, referrer-policy: no-referrer)
// with none of our security headers and no entry in the Cloud Run request log,
// while /healthzz and /Healthz both reach the app normally.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
