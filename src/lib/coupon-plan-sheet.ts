import type { CouponPlanParam, PlanData, WithdrawalData } from "@/types";

export type CouponPlanSheetData = {
  premiumData: PlanData[];
  deathData: PlanData[];
  withdrawalData: WithdrawalData[];
};

/**
 * Turn the raw coupon worksheet grid into the premium / death / withdrawal view models.
 *
 * Mirrors the webview coupon server component: premium keeps columns [0,8) + [13,14), death
 * keeps [0,3) + [8,14) — coupon's grid is 2 columns wider than saving (it adds the
 * 週年紅利及利息 dividend column). Each row is keyed by `param.premiumHeaders` /
 * `param.deathHeaders` (the literal Chinese column names the table renders — backend data
 * keys, NOT UI copy, so never localized). Withdrawals come from column 13 (thousands
 * separators stripped), each paired with its own row's year/age, then filtered to real
 * numbers.
 */
export function buildCouponPlanSheetData(
  sheetData: string[][],
  param: CouponPlanParam,
): CouponPlanSheetData {
  const premiumRows = sheetData.map((row) => [
    ...row.slice(0, 8),
    ...row.slice(13, 14),
  ]);
  const deathRows = sheetData.map((row) => [
    ...row.slice(0, 3),
    ...row.slice(8, 14),
  ]);

  const toPlanData = (rows: string[][], headers: string[]): PlanData[] =>
    rows.map((row) =>
      row.reduce<PlanData>(
        (acc, cur, index) => ({ ...acc, [headers[index]]: cur }),
        {},
      ),
    );

  const premiumData = toPlanData(premiumRows, param.premiumHeaders);
  const deathData = toPlanData(deathRows, param.deathHeaders);

  // Pair each row's withdrawal with ITS OWN year/age before dropping non-numeric cells (see
  // the saving transform — guards against a non-trailing blank shifting later labels).
  const withdrawalData: WithdrawalData[] = sheetData
    .map((row, index) => ({
      year: premiumData[index]?.["年度"] ?? "",
      age: premiumData[index]?.["年齡"] ?? "",
      withdrawal: parseInt((row[13] ?? "").replaceAll(",", ""), 10),
    }))
    .filter((entry) => !isNaN(entry.withdrawal));

  return { premiumData, deathData, withdrawalData };
}
