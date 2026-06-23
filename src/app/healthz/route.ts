import { NextResponse } from "next/server";

// Liveness/readiness probe for Cloud Run. Excluded from the i18n proxy.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
