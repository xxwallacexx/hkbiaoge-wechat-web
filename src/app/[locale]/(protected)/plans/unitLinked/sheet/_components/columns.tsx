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
        period={row.original["保單週年"]}
        startRow={row.index + 2}
        maxWithdrawalPeriod={table.getRowCount() - row.index}
      />
    );
  };
}

// `accessorKey`/`id` are the literal backend header strings (also the data-object keys) and
// must not be localized — PlanDataTable shows/pins columns by these ids. Unit-linked is a
// single 10-column table (身故/death benefit is in-table); 現金提取 is the withdrawal column.
export const columns: ColumnDef<PlanData>[] = [
  {
    accessorKey: "歲數",
    id: "歲數",
    header: rightHeader("歲數"),
    cell: plainCell("歲數"),
    size: 42,
  },
  {
    accessorKey: "保單週年",
    id: "保單週年",
    header: rightHeader("保單週年"),
    cell: plainCell("保單週年"),
    size: 42,
  },
  {
    accessorKey: "基本保費",
    id: "基本保費",
    header: rightHeader("基本保費"),
    cell: plainCell("基本保費"),
  },
  {
    accessorKey: "總保費",
    id: "總保費",
    header: rightHeader("總保費"),
    cell: plainCell("總保費"),
  },
  {
    accessorKey: "戶口價值",
    id: "戶口價值",
    header: rightHeader("戶口價值"),
    cell: signedCell("戶口價值"),
  },
  {
    accessorKey: "退保",
    id: "退保",
    header: rightHeader("退保"),
    cell: plainCell("退保"),
  },
  {
    accessorKey: "當年特別派息",
    id: "當年特別派息",
    header: rightHeader("當年特別派息"),
    cell: signedCell("當年特別派息"),
  },
  {
    accessorKey: "當年額外獎賞",
    id: "當年額外獎賞",
    header: rightHeader("當年額外獎賞"),
    cell: signedCell("當年額外獎賞"),
  },
  {
    accessorKey: "身故",
    id: "身故",
    header: rightHeader("身故"),
    cell: plainCell("身故"),
  },
  {
    accessorKey: "現金提取",
    id: "現金提取",
    header: rightHeader("現金提取"),
    cell: withdrawalCell("現金提取"),
  },
];
