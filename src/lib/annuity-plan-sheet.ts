import type { AnnuityPlanParam, PlanData, WithdrawalData } from "@/types";

export type AnnuityPlanSheetData = {
  /** GENERAL: the single worksheet table (empty for defered/immediate). */
  tableData: PlanData[];
  /** DEFERED: the 現金價值 (cash value) tab (empty otherwise). */
  premiumData: PlanData[];
  /** DEFERED: the 身故賠償 (death benefit) tab (empty otherwise). */
  deathData: PlanData[];
  withdrawalData: WithdrawalData[];
};

/**
 * Turn the raw annuity worksheet grid into the table + withdrawal view models. Unlike every
 * other sheet, annuity branches on `param.annuityPlanType` (mirrors the webview server
 * component's `switch`):
 *
 * - **GENERAL** — one investment-style table: each full row keyed by `param.headers` (no slice).
 *   The withdrawal column is grid col 4 (現金提取, spreadsheet E).
 * - **DEFERED** — the par-style premium/death split (identical column shape to coupon): premium
 *   keeps `[0,8) + [13,14)` keyed by `premiumHeaders`, death keeps `[0,3) + [8,14)` keyed by
 *   `deathHeaders`. The withdrawal column is grid col 13 (spreadsheet N).
 * - **IMMEDIATE** — renders the same premium/death tabs as DEFERED, but the webview only builds
 *   those rows for DEFERED, so the tables come out empty (a latent webview quirk preserved
 *   here; the backend only emits a 10-column grid for IMMEDIATE, so the 14-col slices can't
 *   apply). The `?? ""` guards keep the build from throwing on the missing cells.
 *
 * Headers are the literal Chinese backend column names (never localized). Withdrawals strip the
 * thousands separators, pair with each row's own 年度/年齡, then drop non-numeric cells.
 */
export function buildAnnuityPlanSheetData(
  sheetData: string[][],
  param: AnnuityPlanParam,
): AnnuityPlanSheetData {
  const isGeneral = param.annuityPlanType === "GENERAL";
  const isDefered = param.annuityPlanType === "DEFERED";

  const toPlanData = (rows: string[][], headers: string[]): PlanData[] =>
    rows.map((row) =>
      row.reduce<PlanData>(
        (acc, cur, index) => ({ ...acc, [headers[index] ?? ""]: cur }),
        {},
      ),
    );

  // GENERAL: the whole row zipped against `headers` (no slicing).
  const tableData = isGeneral ? toPlanData(sheetData, param.headers ?? []) : [];

  // DEFERED: the coupon-style premium/death split.
  const premiumData = isDefered
    ? toPlanData(
        sheetData.map((row) => [...row.slice(0, 8), ...row.slice(13, 14)]),
        param.premiumHeaders ?? [],
      )
    : [];
  const deathData = isDefered
    ? toPlanData(
        sheetData.map((row) => [...row.slice(0, 3), ...row.slice(8, 14)]),
        param.deathHeaders ?? [],
      )
    : [];

  // Withdrawal column index follows the plan type: GENERAL reads grid col 4, otherwise col 13.
  // Year/age labels come from whichever table is populated for that type.
  const withdrawalCol = isGeneral ? 4 : 13;
  const labelSource = isGeneral ? tableData : premiumData;
  const withdrawalData: WithdrawalData[] = sheetData
    .map((row, index) => ({
      year: labelSource[index]?.["年度"] ?? "",
      age: labelSource[index]?.["年齡"] ?? "",
      withdrawal: parseInt((row[withdrawalCol] ?? "").replaceAll(",", ""), 10),
    }))
    .filter((entry) => !isNaN(entry.withdrawal));

  return { tableData, premiumData, deathData, withdrawalData };
}
