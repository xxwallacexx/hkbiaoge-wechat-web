import type { PlanData, UnitLinkedPlanParam, WithdrawalData } from "@/types";

export type UnitLinkedPlanSheetData = {
  tableData: PlanData[];
  withdrawalData: WithdrawalData[];
};

/**
 * Turn the raw unit-linked worksheet grid into the table + withdrawal view models.
 *
 * Unlike the other plan sheets, unit-linked is a **single 10-column table** (grid A–J, no
 * premium/death split): each row is `row.slice(0, 10)` keyed by `param.headers` (the literal
 * Chinese backend column names — never localized; 身故 lives in-table). The withdrawal comes
 * from column 9 (現金提取), each paired with its own row's policy year (保單週年) and age
 * (歲數), then filtered to real numbers. (The webview read 年度/年齡 here — keys that don't
 * exist in the unit-linked grid, so its chart labels came out blank; corrected here.)
 */
export function buildUnitLinkedPlanSheetData(
  sheetData: string[][],
  param: UnitLinkedPlanParam,
): UnitLinkedPlanSheetData {
  const tableData: PlanData[] = sheetData.map((row) =>
    row
      .slice(0, 10)
      .reduce<PlanData>(
        (acc, cur, index) => ({ ...acc, [param.headers[index]]: cur }),
        {},
      ),
  );

  const withdrawalData: WithdrawalData[] = sheetData
    .map((row, index) => ({
      year: tableData[index]?.["保單週年"] ?? "",
      age: tableData[index]?.["歲數"] ?? "",
      withdrawal: parseInt((row[9] ?? "").replaceAll(",", ""), 10),
    }))
    .filter((entry) => !isNaN(entry.withdrawal));

  return { tableData, withdrawalData };
}
