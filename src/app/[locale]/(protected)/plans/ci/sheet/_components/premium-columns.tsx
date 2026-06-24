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
// must not be localized — PlanDataTable shows/pins columns by these ids. CI has no
// withdrawal column. The trailing 總額 column is hidden on the premium tab (not in
// premiumHeaders) but kept to mirror the webview columns.
export const premiumColumns: ColumnDef<PlanData>[] = [
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
    accessorKey: "保證現金價值",
    id: "保證現金價值",
    header: rightHeader("保證現金價值"),
    cell: signedCell("保證現金價值"),
  },
  {
    accessorKey: "週年紅利(累積)",
    id: "週年紅利(累積)",
    header: rightHeader("週年紅利(累積)"),
    cell: plainCell("週年紅利(累積)"),
  },
  {
    accessorKey: "終期分紅(現金)",
    id: "終期分紅(現金)",
    header: rightHeader("終期分紅(現金)"),
    cell: signedCell("終期分紅(現金)"),
  },
  {
    accessorKey: "現金總值",
    id: "現金總值",
    header: rightHeader("現金總值"),
    cell: signedCell("現金總值"),
  },
  {
    accessorKey: "總額",
    id: "總額",
    header: rightHeader("總額"),
    cell: plainCell("總額"),
  },
];
