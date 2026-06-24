import { describe, expect, it } from "vitest";

import { buildCouponPlanSheetData } from "@/lib/coupon-plan-sheet";
import type { CouponPlanParam } from "@/types";

const param = {
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
} as unknown as CouponPlanParam;

// 14-column rows (indices 0..13), matching the coupon worksheet shape (2 wider than saving).
const rowOne = [
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
  "1,000",
];
const rowTwo = [
  "2",
  "31",
  "20,000",
  "18,000",
  "16,000",
  "1,000",
  "100",
  "19,100",
  "510,000",
  "16,000",
  "1,000",
  "120",
  "19,620",
  "(500)", // parenthesised (negative) → NaN → dropped from withdrawals
];

describe("buildCouponPlanSheetData", () => {
  it("slices premium columns [0,8)+[13,14) and keys them by premiumHeaders", () => {
    const { premiumData } = buildCouponPlanSheetData([rowOne], param);
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
  });

  it("slices death columns [0,3)+[8,14) and keys them by deathHeaders", () => {
    const { deathData } = buildCouponPlanSheetData([rowOne], param);
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

  it("derives withdrawals from column 13, dropping non-numeric cells", () => {
    const { withdrawalData } = buildCouponPlanSheetData(
      [rowOne, rowTwo],
      param,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });

  it("keeps each surviving withdrawal aligned to its own row when an earlier row is non-numeric", () => {
    const { withdrawalData } = buildCouponPlanSheetData(
      [rowTwo, rowOne],
      param,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });
});
