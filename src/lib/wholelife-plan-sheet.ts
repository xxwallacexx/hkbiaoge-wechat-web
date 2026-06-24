import type { PlanData, WholelifePlanParam, WithdrawalData } from "@/types";

export type WholelifePlanSheetData = {
  premiumData: PlanData[];
  deathData: PlanData[];
  withdrawalData: WithdrawalData[];
};

/**
 * Turn the raw whole-life worksheet grid into the premium / death / withdrawal view models.
 *
 * Mirrors the webview whole-life server component, which is **param-gated** on
 * `param.withdrawalCol`: when set (grid A2:L, 12 cols) premium keeps [0,7)+[11,12), death
 * keeps [0,3)+[7,12), and withdrawals come from column 11; when unset (grid A2:K, 11 cols)
 * premium keeps [0,7), death keeps [0,3)+[7,11), and there is no withdrawal. Each row is
 * keyed by `param.premiumHeaders` / `param.deathHeaders` (literal Chinese backend keys,
 * never localized).
 */
export function buildWholelifePlanSheetData(
  sheetData: string[][],
  param: WholelifePlanParam,
): WholelifePlanSheetData {
  const hasWithdrawal = !!param.withdrawalCol;

  const premiumRows = sheetData.map((row) =>
    hasWithdrawal
      ? [...row.slice(0, 7), ...row.slice(11, 12)]
      : row.slice(0, 7),
  );
  const deathRows = sheetData.map((row) =>
    hasWithdrawal
      ? [...row.slice(0, 3), ...row.slice(7, 12)]
      : [...row.slice(0, 3), ...row.slice(7, 11)],
  );

  const toPlanData = (rows: string[][], headers: string[]): PlanData[] =>
    rows.map((row) =>
      row.reduce<PlanData>(
        (acc, cur, index) => ({ ...acc, [headers[index]]: cur }),
        {},
      ),
    );

  const premiumData = toPlanData(premiumRows, param.premiumHeaders);
  const deathData = toPlanData(deathRows, param.deathHeaders);

  const withdrawalData: WithdrawalData[] = hasWithdrawal
    ? sheetData
        .map((row, index) => ({
          year: premiumData[index]?.["年度"] ?? "",
          age: premiumData[index]?.["年齡"] ?? "",
          withdrawal: parseInt((row[11] ?? "").replaceAll(",", ""), 10),
        }))
        .filter((entry) => !isNaN(entry.withdrawal))
    : [];

  return { premiumData, deathData, withdrawalData };
}
