"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Top bar for the six sheet screens: the plan's name and a button that generates its PDF and
 * opens it. Like `PlanHeader` there is no back button — the Mini Program web-view provides
 * native back navigation — and like `PlanHeader` / `ExpiredCard` the labels arrive as props,
 * because each plan reads them from its own translation namespace.
 *
 * The height is fixed at h-14, and `PlanDataTable` subtracts it from the worksheet's max
 * height so the table still ends above the bottom bar.
 */
export function SheetHeader({
  title,
  downloadLabel,
  busyLabel,
  isBusy,
  onDownload,
}: {
  title: string;
  downloadLabel: string;
  /** Shown while the PDF renders; the button is disabled for that whole time. */
  busyLabel: string;
  isBusy: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="flex h-14 items-center justify-between gap-3 bg-primary px-4 text-primary-foreground">
      <h1 className="line-clamp-1 text-base font-semibold">{title}</h1>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0"
        disabled={isBusy}
        onClick={onDownload}
      >
        {isBusy ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-4 w-4" />
        )}
        {isBusy ? busyLabel : downloadLabel}
      </Button>
    </div>
  );
}
