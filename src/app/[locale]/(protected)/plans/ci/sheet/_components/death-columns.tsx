"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";

import type { PlanData } from "@/types";

// Cells whose value is parenthesised (e.g. "(1,234)") are negative — render them red.
const negativeRegex = /\((.*?)\)/;

function rightHeader(label: string) {
  return function Header() {
    return <div className="text-nowrap text-right">{label}</div>;
  };
}

function plainCell(key: string) {
  return function Cell({ row }: CellContext<PlanData, unknown>) {
    return <div className="text-right">{row.original[key]}</div>;
  };
}

function signedCell(key: string) {
  return function Cell({ row }: CellContext<PlanData, unknown>) {
    const negative = negativeRegex.test(row.original[key]);
    return (
      <div className={`text-right ${negative ? "text-red-700" : "text-black"}`}>
        {row.original[key]}
      </div>
    );
  };
}

// `accessorKey`/`id` are the literal backend header strings (also the data-object keys) and
// must not be localized. CI has no withdrawal column; death uses plain 身故賠償 wording.
export const deathColumns: ColumnDef<PlanData>[] = [
  {
    accessorKey: "年度",
    id: "年度",
    header: rightHeader("年度"),
    cell: plainCell("年度"),
    size: 42,
  },
  {
    accessorKey: "年齡",
    id: "年齡",
    header: rightHeader("年齡"),
    cell: plainCell("年齡"),
    size: 42,
  },
  {
    accessorKey: "總保費",
    id: "總保費",
    header: rightHeader("總保費"),
    cell: plainCell("總保費"),
  },
  {
    accessorKey: "保證身故賠償",
    id: "保證身故賠償",
    header: rightHeader("保證身故賠償"),
    cell: signedCell("保證身故賠償"),
  },
  {
    accessorKey: "週年紅利(累積)",
    id: "週年紅利(累積)",
    header: rightHeader("週年紅利(累積)"),
    cell: plainCell("週年紅利(累積)"),
  },
  {
    accessorKey: "終期分紅(身故)",
    id: "終期分紅(身故)",
    header: rightHeader("終期分紅(身故)"),
    cell: signedCell("終期分紅(身故)"),
  },
  {
    accessorKey: "身故總額",
    id: "身故總額",
    header: rightHeader("身故總額"),
    cell: signedCell("身故總額"),
  },
  {
    accessorKey: "總額",
    id: "總額",
    header: rightHeader("總額"),
    cell: plainCell("總額"),
  },
];
