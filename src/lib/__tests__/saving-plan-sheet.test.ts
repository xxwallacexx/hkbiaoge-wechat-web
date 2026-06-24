import { describe, expect, it } from "vitest";

import { buildSavingPlanSheetData } from "@/lib/saving-plan-sheet";
import type { SavingPlanParam } from "@/types";

const param = {
  premiumHeaders: [
    "年度",
    "年齡",
    "總保費",
    "保證現金價值",
    "週年紅利(累積)",
    "終期分紅(現金)",
    "現金總值",
    "提款(年末)",
  ],
  deathHeaders: [
    "年度",
    "年齡",
    "總保費",
    "保證身故賠償",
    "週年紅利(累積)",
    "終期分紅(身故)",
    "身故總額",
    "提款(年末)",
  ],
} as unknown as SavingPlanParam;

// 12-column rows (indices 0..11), matching the worksheet shape the API returns.
const rowOne = [
  "1",
  "30",
  "10,000",
  "9,000",
  "100",
  "50",
  "9,150",
  "500,000",
  "200",
  "60",
  "9,810",
  "1,000",
];
const rowTwo = [
  "2",
  "31",
  "20,000",
  "18,000",
  "200",
  "100",
  "18,300",
  "510,000",
  "400",
  "120",
  "19,620",
  "(500)", // a parenthesized (negative) cell — must be dropped from withdrawals
];

describe("buildSavingPlanSheetData", () => {
  it("slices premium columns [0,7)+[11,12) and keys them by premiumHeaders", () => {
    const { premiumData } = buildSavingPlanSheetData([rowOne], param);
    expect(premiumData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證現金價值: "9,000",
      "週年紅利(累積)": "100",
      "終期分紅(現金)": "50",
      現金總值: "9,150",
      "提款(年末)": "1,000",
    });
  });

  it("slices death columns [0,3)+[7,12) and keys them by deathHeaders", () => {
    const { deathData } = buildSavingPlanSheetData([rowOne], param);
    expect(deathData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證身故賠償: "500,000",
      "週年紅利(累積)": "200",
      "終期分紅(身故)": "60",
      身故總額: "9,810",
      "提款(年末)": "1,000",
    });
  });

  it("derives withdrawals from column 11 with year/age, dropping non-numeric cells", () => {
    const { withdrawalData } = buildSavingPlanSheetData(
      [rowOne, rowTwo],
      param,
    );
    // rowTwo's "(500)" parses to NaN and is filtered out, leaving only rowOne.
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });

  it("keeps each surviving withdrawal aligned to its own row when an earlier row is non-numeric", () => {
    // rowTwo (year 2) has a non-numeric withdrawal and is dropped; rowOne's 1000 must keep
    // its OWN year (1), not borrow the dropped earlier row's label.
    const { withdrawalData } = buildSavingPlanSheetData(
      [rowTwo, rowOne],
      param,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });
});
