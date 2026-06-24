"use client";

import {
  type Column,
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { type CSSProperties, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  headers: string[];
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const getCommonPinningStyles = <TData,>(
  column: Column<TData>,
): CSSProperties => {
  const isPinned = column.getIsPinned() === "left";
  const isLastPinnedColumn = isPinned && column.getIsLastColumn("left");

  return {
    boxShadow: isLastPinnedColumn ? "-4px 0 4px -4px gray inset" : undefined,
    left: isPinned ? `${column.getStart("left")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: `${column.getSize()}px`,
    zIndex: isPinned ? 1 : 0,
  };
};

/**
 * Worksheet table for the saving-plan sheet (ported from webview). Pins the 年度/年齡
 * columns to the left, hides any column whose `id` isn't in `headers` (the backend's
 * premium/death header list), stripes the rows, and highlights the tapped row.
 */
export function PlanDataTable<TData, TValue>({
  headers,
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const columnVisibility: VisibilityState = {};
  for (const col of columns) {
    if (!col.id) continue;
    if (!headers.includes(col.id)) {
      columnVisibility[col.id] = false;
    }
  }

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    initialState: {
      columnVisibility,
      columnPinning: {
        left: ["年度", "年齡"],
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Table
      className="inline-table border-collapse relative"
      divClassname="max-h-[95vh] overflow-y-scroll"
    >
      <TableHeader className="sticky w-full top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                style={{ ...getCommonPinningStyles(header.column) }}
                key={header.id}
                className="bg-blue-500 text-white"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() && "selected"}
            onClick={() => {
              table.resetRowSelection();
              row.toggleSelected();
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const isOdd = (row.index + 1) & 1;
              const isSelected = row.getIsSelected();

              return (
                <TableCell
                  key={cell.id}
                  style={{ ...getCommonPinningStyles(cell.column) }}
                  className={`${isSelected ? "bg-blue-500" : isOdd ? "bg-white" : "bg-blue-300"} `}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
