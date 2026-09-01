"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string | number;
  exactMatch?: boolean;
}

export interface SidebarProps {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ title, subtitle, items, footer, className = "" }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={cn("w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col", className)}>
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-brand text-white flex items-center justify-center text-lg">
            🐾
          </div>
          <div>
            <h1 className="text-base font-bold text-ink leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Principal">
        {items.map((item) => {
          const isActive = item.exactMatch
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-soft text-brand"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-base flex-shrink-0 w-5 flex items-center justify-center" aria-hidden>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-brand text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="p-3 border-t border-border">{footer}</div>}
    </aside>
  );
}