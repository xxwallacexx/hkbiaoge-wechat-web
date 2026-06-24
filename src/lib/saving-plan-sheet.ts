import type { PlanData, SavingPlanParam, WithdrawalData } from "@/types";

export type SavingPlanSheetData = {
  premiumData: PlanData[];
  deathData: PlanData[];
  withdrawalData: WithdrawalData[];
};

/**
 * Turn the raw worksheet grid into the premium / death / withdrawal view models.
 *
 * Mirrors the webview server-component transform: premium keeps columns [0,7) + [11,12),
 * death keeps [0,3) + [7,12); each row is then keyed by `param.premiumHeaders` /
 * `param.deathHeaders` (the literal Chinese column names the table renders — these are
 * backend data keys, NOT UI copy, so they are never localized). Withdrawals come from
 * column 11 (thousands separators stripped), each paired with its own row's year/age and
 * then filtered to real numbers.
 */
export function buildSavingPlanSheetData(
  sheetData: string[][],
  param: SavingPlanParam,
): SavingPlanSheetData {
  const premiumRows = sheetData.map((row) => [
    ...row.slice(0, 7),
    ...row.slice(11, 12),
  ]);
  const deathRows = sheetData.map((row) => [
    ...row.slice(0, 3),
    ...row.slice(7, 12),
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

  // Pair each row's withdrawal with ITS OWN year/age BEFORE dropping non-numeric cells. (The
  // webview source filtered first, then index-zipped the survivors against the *unfiltered*
  // premium rows — which mislabels every row after a non-trailing NaN. Corrected here.)
  const withdrawalData: WithdrawalData[] = sheetData
    .map((row, index) => ({
      year: premiumData[index]?.["年度"] ?? "",
      age: premiumData[index]?.["年齡"] ?? "",
      withdrawal: parseInt((row[11] ?? "").replaceAll(",", ""), 10),
    }))
    .filter((entry) => !isNaN(entry.withdrawal));

  return { premiumData, deathData, withdrawalData };
}
