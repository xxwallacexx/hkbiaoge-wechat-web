import { cn } from "@/lib/utils";
import type { PlanOverview } from "@/types";

/**
 * One insurance-plan row: a colored company badge, the plan title, and a truncated
 * detail line. Mirrors the mobile PlanIntroCard. Renders as a button when `onPress` is
 * given (a tappable row), otherwise a plain row.
 */
export function PlanCard({
  plan,
  onPress,
}: {
  plan: PlanOverview;
  onPress?: () => void;
}) {
  const company = plan.insuranceCompanyDetail;
  const base =
    "flex w-full items-center gap-3 border-b px-4 py-3 text-left md:gap-4 md:px-5 md:py-4";
  const inner = (
    <>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md px-1 text-center text-sm font-semibold leading-tight text-white md:h-16 md:w-16"
        style={{ backgroundColor: company?.bg || "#64748b" }}
      >
        {company?.name}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold md:text-lg">
          {plan.name}
        </p>
        <p className="truncate text-sm text-muted-foreground md:text-base">
          {plan.info}
        </p>
      </div>
    </>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={cn(
          base,
          "transition-colors hover:bg-muted/50 active:bg-muted",
        )}
      >
        {inner}
      </button>
    );
  }

  return <div className={base}>{inner}</div>;
}
