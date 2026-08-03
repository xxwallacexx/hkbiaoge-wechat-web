import type { Promotion } from "@/types";

/**
 * One promotion row: a colored company badge (the company's realName) and the promotion title.
 * The company lookup is `$ifNull`-guarded server side, so both the badge label and its color
 * tolerate a missing company.
 */
export function PromotionCard({
  promotion,
  onPress,
}: {
  promotion: Promotion;
  onPress: () => void;
}) {
  const company = promotion.insuranceCompanyDetail;

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted md:gap-4 md:px-5 md:py-4"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md px-1 text-center text-sm font-semibold leading-tight text-white md:h-16 md:w-16"
        style={{ backgroundColor: company?.bg || "#64748b" }}
      >
        {company?.realName}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-semibold md:text-lg">
          {promotion.name}
        </p>
      </div>
    </button>
  );
}
