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

/** Which of the sheet's bottom-bar editors this plan enables, plus how many there are. */
export type UnitLinkedSheetControls = {
  hasHealthArea: boolean;
  hasAnnuity: boolean;
  hasCoupleAnnuity: boolean;
  extraButtonCount: number;
};

/**
 * Decide which optional bottom-bar editors the unit-linked sheet shows (mirrors the webview's
 * inline gating): the type-B health/area editor (needs both cells) and the type-C annuity /
 * couple-annuity editors (each needs its range + type options + the shared annuity constraint).
 * `extraButtonCount` drives the tab list's shrinking col-span in the screen. Gating is by data
 * presence, so a given plan naturally lights up only its own editors.
 */
export function getUnitLinkedSheetControls(
  param: UnitLinkedPlanParam,
): UnitLinkedSheetControls {
  const hasHealthArea = !!(param.areaCell && param.healthCell);
  const hasAnnuity = !!(
    param.annuityRange &&
    param.annuityTypeOptions &&
    param.annuityConstraint
  );
  const hasCoupleAnnuity = !!(
    param.coupleAnnuityRange &&
    param.coupleAnnuityTypeOptions &&
    param.annuityConstraint
  );
  return {
    hasHealthArea,
    hasAnnuity,
    hasCoupleAnnuity,
    extraButtonCount:
      Number(hasHealthArea) + Number(hasAnnuity) + Number(hasCoupleAnnuity),
  };
}
