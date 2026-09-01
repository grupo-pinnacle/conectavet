"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ items, defaultValue, value, onChange, className = "" }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue || items[0]?.id || "");
  const active = value ?? internal;

  const handleClick = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  return (
    <div className={className}>
      <div className="flex border-b border-border overflow-x-auto" role="tablist">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative",
                isActive ? "text-brand" : "text-ink-soft hover:text-ink"
              )}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-brand text-white">
                    {item.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}