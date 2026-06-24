import { describe, expect, it } from "vitest";

import { buildCiPlanSheetData } from "@/lib/ci-plan-sheet";
import type { CiPlanParam } from "@/types";

const param = {
  premiumHeaders: [
    "年度",
    "年齡",
    "總保費",
    "保證現金價值",
    "週年紅利(累積)",
    "終期分紅(現金)",
    "現金總值",
  ],
  deathHeaders: [
    "年度",
    "年齡",
    "總保費",
    "保證身故賠償",
    "週年紅利(累積)",
    "終期分紅(身故)",
    "身故總額",
    "總額",
  ],
} as unknown as CiPlanParam;

// 12-column row (indices 0..11), matching the CI worksheet shape (range A2:L).
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
  "510,000",
];

describe("buildCiPlanSheetData", () => {
  it("slices premium columns [0,7) and keys them by premiumHeaders", () => {
    const { premiumData } = buildCiPlanSheetData([rowOne], param);
    expect(premiumData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證現金價值: "9,000",
      "週年紅利(累積)": "100",
      "終期分紅(現金)": "50",
      現金總值: "9,150",
    });
  });

  it("slices death columns [0,3)+[7,12) and keys them by deathHeaders", () => {
    const { deathData } = buildCiPlanSheetData([rowOne], param);
    expect(deathData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證身故賠償: "500,000",
      "週年紅利(累積)": "200",
      "終期分紅(身故)": "60",
      身故總額: "9,810",
      總額: "510,000",
    });
  });
});
