import { cn } from "@/lib/utils";
import type { Brochure } from "@/types";

/**
 * One brochure row: a colored company badge (the company's realName) and the brochure title.
 * Mirrors the mobile HandbookIntroCard. Renders as a button when `onPress` is given.
 */
export function BrochureCard({
  brochure,
  onPress,
}: {
  brochure: Brochure;
  onPress?: () => void;
}) {
  const company = brochure.insuranceCompanyDetail;
  const base =
    "flex w-full items-center gap-3 border-b px-4 py-3 text-left md:gap-4 md:px-5 md:py-4";
  const inner = (
    <>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md px-1 text-center text-sm font-semibold leading-tight text-white md:h-16 md:w-16"
        style={{ backgroundColor: company?.bg || "#64748b" }}
      >
        {company?.realName}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-semibold md:text-lg">
          {brochure.name}
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
