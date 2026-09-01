"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function FilterPanel({ children, title = "Filtros", className = "" }: FilterPanelProps) {
  return (
    <aside className={cn("bg-white border border-border rounded-[var(--radius-lg)] p-4 space-y-4", className)}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="space-y-3">{children}</div>
    </aside>
  );
}