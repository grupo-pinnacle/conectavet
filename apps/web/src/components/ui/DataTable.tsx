"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage = "Sin datos", onRowClick, className = "" }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-12 text-center text-ink-soft">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className={cn("bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink-soft">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("text-left font-medium px-4 py-3", c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("border-t border-border", onRowClick && "cursor-pointer hover:bg-surface")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}