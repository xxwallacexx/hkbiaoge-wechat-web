import type { SavingPlanDetail } from "@/types";

/**
 * Plan-detail header: a colored company badge, the plan title, and a one-line detail.
 * Mirrors the mobile PlanIntroCard.
 */
export function PlanIntroCard({
  planDetail,
}: {
  planDetail: SavingPlanDetail;
}) {
  const company = planDetail.insuranceCompanyDetail;
  return (
    <div className="flex items-center gap-3 p-2">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md px-1 text-center text-sm font-semibold leading-tight text-white"
        style={{ backgroundColor: company.bg || "#64748b" }}
      >
        {company.name}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{planDetail.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {planDetail.info}
        </p>
      </div>
    </div>
  );
}
