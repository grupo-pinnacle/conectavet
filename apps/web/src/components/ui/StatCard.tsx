"use client";

import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; positive?: boolean };
  variant?: "default" | "brand" | "success" | "warning";
  className?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, { bg: string; text: string; iconBg: string }> = {
  default: { bg: "bg-white", text: "text-ink", iconBg: "bg-surface" },
  brand: { bg: "bg-brand-soft", text: "text-brand", iconBg: "bg-brand/15" },
  success: { bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100" },
};

export function StatCard({ label, value, icon, trend, variant = "default", className = "" }: StatCardProps) {
  const v = variantStyles[variant];
  return (
    <div className={`${v.bg} border border-border rounded-[var(--radius-lg)] p-4 shadow-card ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-ink-soft font-medium">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-full ${v.iconBg} flex items-center justify-center text-lg`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${v.text}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
          {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </p>
      )}
    </div>
  );
}