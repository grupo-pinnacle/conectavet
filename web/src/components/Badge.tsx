import type { ReactNode } from "react";

interface BadgeProps {
  label: string;
  variant?: "filled" | "soft" | "outlined";
  size?: "sm" | "md";
  color?: string;
  bg?: string;
  icon?: ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-caption gap-0.5",
  md: "px-3 py-1 text-label gap-1",
};

const variantStyles = {
  filled: "text-white border-0",
  soft: "border-0",
  outlined: "bg-transparent border",
};

export default function Badge({
  label, variant = "filled", size = "md", color, bg, icon, className = "",
}: BadgeProps) {
  const defaultColors = {
    filled: { bg: "bg-teal-700", text: "text-white" },
    soft: { bg: "bg-teal-50", text: "text-teal-700" },
    outlined: { bg: "", text: "text-ink", border: "border-border" },
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-semibold min-h-[20px]",
        sizeStyles[size],
        variantStyles[variant],
        bg || defaultColors[variant].bg,
        color || defaultColors[variant].text,
        variant === "outlined" ? "border-border" : "",
        className,
      ].join(" ")}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </span>
  );
}
