import { describe, expect, it } from "vitest";

import { buildWholelifePlanSheetData } from "@/lib/wholelife-plan-sheet";
import type { WholelifePlanParam } from "@/types";

const activeParam = {
  withdrawalCol: "L",
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
} as unknown as WholelifePlanParam;

const inactiveParam = {
  withdrawalCol: "",
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
  ],
} as unknown as WholelifePlanParam;

// 12-column row (A2:L) when withdrawal is active.
const activeRow = [
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
// 11-column row (A2:K) when withdrawal is inactive.
const inactiveRow = [
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
];

describe("buildWholelifePlanSheetData", () => {
  it("with withdrawalCol set: slices premium [0,7)+[11,12) and death [0,3)+[7,12)", () => {
    const { premiumData, deathData } = buildWholelifePlanSheetData(
      [activeRow],
      activeParam,
    );
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

  it("with withdrawalCol set: derives withdrawals from column 11", () => {
    const { withdrawalData } = buildWholelifePlanSheetData(
      [activeRow],
      activeParam,
    );
    expect(withdrawalData).toEqual([
      { year: "1", age: "30", withdrawal: 1000 },
    ]);
  });

  it("without withdrawalCol: slices premium [0,7) and death [0,3)+[7,11), no withdrawal", () => {
    const { premiumData, deathData, withdrawalData } =
      buildWholelifePlanSheetData([inactiveRow], inactiveParam);
    expect(premiumData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證現金價值: "9,000",
      "週年紅利(累積)": "100",
      "終期分紅(現金)": "50",
      現金總值: "9,150",
    });
    expect(deathData[0]).toEqual({
      年度: "1",
      年齡: "30",
      總保費: "10,000",
      保證身故賠償: "500,000",
      "週年紅利(累積)": "200",
      "終期分紅(身故)": "60",
      身故總額: "9,810",
    });
    expect(withdrawalData).toEqual([]);
  });
});
