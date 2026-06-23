import { cn } from "@/lib/utils";

/**
 * Numbered step indicator (e.g. 1 → 2): a row of numbered circles with the active one
 * highlighted. Mirrors the mobile ProgressIndicator. Presentational and locale-agnostic.
 */
export function ProgressIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${current} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
              step === current
                ? "bg-primary text-primary-foreground"
                : "bg-white/30 text-white",
            )}
          >
            {step}
          </span>
          {step !== total && <span className="h-px w-6 bg-white/40" />}
        </div>
      ))}
    </div>
  );
}
