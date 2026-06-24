import type { CiPlanParam, PlanData } from "@/types";

export type CiPlanSheetData = {
  premiumData: PlanData[];
  deathData: PlanData[];
};

/**
 * Turn the raw CI worksheet grid into the premium / death view models.
 *
 * Mirrors the webview CI server component: premium keeps columns [0,7), death keeps
 * [0,3) + [7,12) (the CI grid is A2:L, 12 columns). Each row is keyed by
 * `param.premiumHeaders` / `param.deathHeaders` (the literal Chinese column names the table
 * renders — backend data keys, NOT UI copy, so never localized). Unlike saving/coupon, CI
 * has NO withdrawal column / editor, so there's no withdrawal view model.
 */
export function buildCiPlanSheetData(
  sheetData: string[][],
  param: CiPlanParam,
): CiPlanSheetData {
  const premiumRows = sheetData.map((row) => row.slice(0, 7));
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

  return {
    premiumData: toPlanData(premiumRows, param.premiumHeaders),
    deathData: toPlanData(deathRows, param.deathHeaders),
  };
}
