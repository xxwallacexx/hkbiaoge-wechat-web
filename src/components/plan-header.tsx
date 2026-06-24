"use client";

import { Info } from "lucide-react";

import { ProgressIndicator } from "@/components/progress-indicator";

/**
 * Shared gradient header for the plan basic-info / param screens: a centered title with an
 * optional step indicator and an optional info button. There is intentionally no back button —
 * the WeChat Mini Program web-view provides native back navigation, so an in-page one is
 * redundant.
 */
export function PlanHeader({
  title,
  progress,
  onInfoPress,
  infoLabel,
}: {
  title: string;
  /** When set, renders the "step N / total" indicator above the title. */
  progress?: { current: number; total: number };
  /** When set, renders an info button on the right that calls this on press. */
  onInfoPress?: () => void;
  infoLabel?: string;
}) {
  return (
    <div className="relative flex flex-col items-center gap-3 rounded-b-3xl bg-gradient-to-b from-primary to-primary/90 px-4 pb-8 pt-6 text-primary-foreground">
      {onInfoPress ? (
        <button
          type="button"
          onClick={onInfoPress}
          aria-label={infoLabel}
          className="absolute right-4 top-6 rounded-full border border-white/60 p-1.5 hover:bg-white/10"
        >
          <Info className="h-5 w-5" />
        </button>
      ) : null}
      {progress ? (
        <ProgressIndicator current={progress.current} total={progress.total} />
      ) : null}
      <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
    </div>
  );
}
