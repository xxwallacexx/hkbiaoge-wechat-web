"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";

import type { PlanData } from "@/types";

import { WithdrawalDialog } from "./withdrawal-dialog";

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

function withdrawalCell(key: string) {
  return function Cell({ row, table }: CellContext<PlanData, unknown>) {
    return (
      <WithdrawalDialog
        value={row.original[key]}
        period={row.original["年度"]}
        startRow={row.index + 2}
        maxWithdrawalPeriod={table.getRowCount() - row.index}
      />
    );
  };
}

// `accessorKey`/`id` are the literal backend header strings (also the data-object keys) and
// must not be localized — PlanDataTable shows/pins columns by these ids.
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
    accessorKey: "提款(年末)",
    id: "提款(年末)",
    header: rightHeader("提款(年末)"),
    cell: withdrawalCell("提款(年末)"),
  },
  {
    accessorKey: "提款(年初)",
    id: "提款(年初)",
    header: rightHeader("提款(年初)"),
    cell: withdrawalCell("提款(年初)"),
  },
];
