import { describe, expect, it } from "vitest";

import { buildUnitLinkedPlanSheetData } from "@/lib/unit-linked-plan-sheet";
import type { UnitLinkedPlanParam } from "@/types";

const param = {
  headers: [
    "歲數",
    "保單週年",
    "基本保費",
    "總保費",
    "戶口價值",
    "退保",
    "當年特別派息",
    "當年額外獎賞",
    "身故",
    "現金提取",
  ],
} as unknown as UnitLinkedPlanParam;

// 10-column rows (grid A–J).
const rowOne = [
  "30",
  "1",
  "5,000",
  "5,000",
  "4,800",
  "4,000",
  "100",
  "50",
  "500,000",
  "1,000",
];
const rowTwo = [
  "31",
  "2",
  "10,000",
  "10,000",
  "9,600",
  "8,000",
  "200",
  "100",
  "510,000",
  "(500)", // parenthesised (negative) → NaN → dropped from withdrawals
];

describe("buildUnitLinkedPlanSheetData", () => {
  it("slices the single 10-column table and keys it by param.headers", () => {
    const { tableData } = buildUnitLinkedPlanSheetData([rowOne], param);
    expect(tableData[0]).toEqual({
      歲數: "30",
      保單週年: "1",
      基本保費: "5,000",
      總保費: "5,000",
      戶口價值: "4,800",
      退保: "4,000",
      當年特別派息: "100",
      當年額外獎賞: "50",
      身故: "500,000",
      現金提取: "1,000",
    });
  });

  it("derives withdrawals from column 9 (保單週年/歲數 labels), dropping non-numeric cells", () => {
    const { withdrawalData } = buildUnitLinkedPlanSheetData(
      [rowOne, rowTwo],
      param,
    );
    // rowTwo's "(500)" parses to NaN and is dropped; rowOne keeps its own year/age.
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });
});
