import { describe, expect, it } from "vitest";

import { buildAnnuityPlanSheetData } from "@/lib/annuity-plan-sheet";
import type { AnnuityPlanParam } from "@/types";

// GENERAL — one investment-style table; the whole row is keyed by `headers` (no slice) and the
// withdrawal is grid col 4 (現金提取, here placed at index 4 to match that column).
const generalParam = {
  annuityPlanType: "GENERAL",
  headers: [
    "年度",
    "年齡",
    "基本保費",
    "總保費",
    "現金提取",
    "戶口價值",
    "退保",
    "額外利息",
    "特別回報",
  ],
} as unknown as AnnuityPlanParam;

const generalRow = [
  "1",
  "30",
  "100",
  "1,000",
  "5,000", // col 4 → withdrawal
  "9,000",
  "8,000",
  "50",
  "60",
];

// DEFERED — the coupon-style premium/death split over a 14-column grid.
const deferedParam = {
  annuityPlanType: "DEFERED",
  premiumHeaders: [
    "年度",
    "年齡",
    "總保費",
    "保證現金價值",
    "累計保証現金",
    "週年紅利及利息",
    "終期分紅(現金)",
    "現金總值",
    "提款(年末)",
  ],
  deathHeaders: [
    "年度",
    "年齡",
    "總保費",
    "最低身故賠償",
    "累計保証現金",
    "週年紅利及利息",
    "終期分紅(身故)",
    "身故總額",
    "提款(年末)",
  ],
} as unknown as AnnuityPlanParam;

const deferedRow = [
  "1",
  "30",
  "10,000",
  "9,000",
  "8,000",
  "500",
  "50",
  "9,550",
  "500,000",
  "8,000",
  "500",
  "60",
  "9,810",
  "1,000", // col 13 → withdrawal
];

describe("buildAnnuityPlanSheetData — GENERAL", () => {
  it("keys the whole row by headers (no slice) and leaves premium/death empty", () => {
    const { tableData, premiumData, deathData } = buildAnnuityPlanSheetData(
      [generalRow],
      generalParam,
    );
    expect(tableData[0]).toEqual({
      年度: "1",
      年齡: "30",
      基本保費: "100",
      總保費: "1,000",
      現金提取: "5,000",
      戶口價值: "9,000",
      退保: "8,000",
      額外利息: "50",
      特別回報: "60",
    });
    expect(premiumData).toEqual([]);
    expect(deathData).toEqual([]);
  });

  it("maps a trailing grid cell with no header to the empty key (full-row, not sliced)", () => {
    const { tableData } = buildAnnuityPlanSheetData(
      [[...generalRow, "extra"]],
      generalParam,
    );
    expect(tableData[0][""]).toBe("extra");
  });

  it("derives withdrawals from column 4 paired with each row's 年度/年齡", () => {
    const { withdrawalData } = buildAnnuityPlanSheetData(
      [generalRow],
      generalParam,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 5000 },
    ]);
  });
});

describe("buildAnnuityPlanSheetData — DEFERED", () => {
  it("slices premium [0,8)+[13,14) and death [0,3)+[8,14), leaving the GENERAL table empty", () => {
    const { tableData, premiumData, deathData } = buildAnnuityPlanSheetData(
      [deferedRow],
      deferedParam,
    );
    expect(tableData).toEqual([]);
    expect(premiumData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證現金價值: "9,000",
      累計保証現金: "8,000",
      週年紅利及利息: "500",
      "終期分紅(現金)": "50",
      現金總值: "9,550",
      "提款(年末)": "1,000",
    });
    expect(deathData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      最低身故賠償: "500,000",
      累計保証現金: "8,000",
      週年紅利及利息: "500",
      "終期分紅(身故)": "60",
      身故總額: "9,810",
      "提款(年末)": "1,000",
    });
  });

  it("derives withdrawals from column 13 paired with the premium row's 年度/年齡", () => {
    const { withdrawalData } = buildAnnuityPlanSheetData(
      [deferedRow],
      deferedParam,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });
});

describe("buildAnnuityPlanSheetData — IMMEDIATE", () => {
  it("produces empty tables without throwing (10-col grid can't fill the 14-col slices)", () => {
    const immediateParam = {
      annuityPlanType: "IMMEDIATE",
      premiumHeaders: deferedParam.premiumHeaders,
      deathHeaders: deferedParam.deathHeaders,
    } as unknown as AnnuityPlanParam;
    const { tableData, premiumData, deathData, withdrawalData } =
      buildAnnuityPlanSheetData(
        [
          [
            "1",
            "30",
            "100",
            "1,000",
            "5,000",
            "9,000",
            "8,000",
            "50",
            "60",
            "0",
          ],
        ],
        immediateParam,
      );
    expect(tableData).toEqual([]);
    expect(premiumData).toEqual([]);
    expect(deathData).toEqual([]);
    expect(withdrawalData).toEqual([]);
  });
});
