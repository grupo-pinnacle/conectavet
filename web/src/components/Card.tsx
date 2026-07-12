import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "elevated" | "outlined" | "ghost";
  padding?: string;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children, variant = "elevated", padding = "p-4", className = "", onClick,
}: CardProps) {
  const variantStyles = {
    elevated: "bg-surface-card rounded-xl shadow-raised border-0",
    outlined: "bg-surface-card rounded-xl shadow-none border border-border",
    ghost: "bg-transparent rounded-xl shadow-none border-0",
  };

  return (
    <div
      onClick={onClick}
      className={[
        variantStyles[variant],
        padding,
        onClick ? "cursor-pointer transition-all duration-fast hover:shadow-overlay active:scale-[0.98]" : "",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
        className,
      ].join(" ")}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
