import { describe, expect, it } from "vitest";

import {
  buildUnitLinkedPlanSheetData,
  getUnitLinkedSheetControls,
} from "@/lib/unit-linked-plan-sheet";
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

  // Type C draws a different 10-column header set from the same static columns superset,
  // adding 年齡 / 特別獎賞 / 特別回報. The transform is header-driven, so it keys them the same
  // way and still reads the withdrawal from column 9 (現金提取).
  it("keys a type-C header set (年齡/特別獎賞/特別回報) and still reads withdrawals from col 9", () => {
    const typeCParam = {
      headers: [
        "歲數",
        "年齡",
        "保單週年",
        "基本保費",
        "戶口價值",
        "退保",
        "特別獎賞",
        "特別回報",
        "身故",
        "現金提取",
      ],
    } as unknown as UnitLinkedPlanParam;
    const typeCRow = [
      "30",
      "31",
      "1",
      "5,000",
      "4,800",
      "4,000",
      "80",
      "90",
      "500,000",
      "1,000",
    ];
    const { tableData, withdrawalData } = buildUnitLinkedPlanSheetData(
      [typeCRow],
      typeCParam,
    );
    expect(tableData[0]).toEqual({
      歲數: "30",
      年齡: "31",
      保單週年: "1",
      基本保費: "5,000",
      戶口價值: "4,800",
      退保: "4,000",
      特別獎賞: "80",
      特別回報: "90",
      身故: "500,000",
      現金提取: "1,000",
    });
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });
});

describe("getUnitLinkedSheetControls", () => {
  const typeA = {} as unknown as UnitLinkedPlanParam;

  const typeB = {
    areaCell: "R1",
    healthCell: "R2",
  } as unknown as UnitLinkedPlanParam;

  const annuityFields = {
    annuityRange: "R16:R17",
    annuityTypeOptions: ["A", "B"],
    annuityConstraint: { minAge: 50, maxAge: 100 },
  };
  const coupleFields = {
    coupleAnnuityRange: "R23:R24",
    coupleAnnuityTypeOptions: ["聯合", "聯合回奉"],
  };
  const typeCBoth = {
    ...annuityFields,
    ...coupleFields,
  } as unknown as UnitLinkedPlanParam;
  const typeCAnnuityOnly = {
    ...annuityFields,
  } as unknown as UnitLinkedPlanParam;

  it("type A (no cells) → all flags false, no extra buttons", () => {
    expect(getUnitLinkedSheetControls(typeA)).toEqual({
      hasHealthArea: false,
      hasAnnuity: false,
      hasCoupleAnnuity: false,
      extraButtonCount: 0,
    });
  });

  it("type B (areaCell + healthCell) → only health/area, one extra button", () => {
    expect(getUnitLinkedSheetControls(typeB)).toEqual({
      hasHealthArea: true,
      hasAnnuity: false,
      hasCoupleAnnuity: false,
      extraButtonCount: 1,
    });
  });

  it("type C (annuity + couple ranges) → both annuity flags, two extra buttons", () => {
    expect(getUnitLinkedSheetControls(typeCBoth)).toEqual({
      hasHealthArea: false,
      hasAnnuity: true,
      hasCoupleAnnuity: true,
      extraButtonCount: 2,
    });
  });

  it("type C annuity-only (no couple range) → one extra button", () => {
    const controls = getUnitLinkedSheetControls(typeCAnnuityOnly);
    expect(controls.hasAnnuity).toBe(true);
    expect(controls.hasCoupleAnnuity).toBe(false);
    expect(controls.extraButtonCount).toBe(1);
  });

  it("does not enable annuity when the constraint is missing (all three required)", () => {
    const partial = {
      annuityRange: "R16:R17",
      annuityTypeOptions: ["A"],
      // annuityConstraint intentionally absent
    } as unknown as UnitLinkedPlanParam;
    expect(getUnitLinkedSheetControls(partial).hasAnnuity).toBe(false);
  });
});
