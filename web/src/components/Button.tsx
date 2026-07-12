import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "text";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

const sizeStyles = {
  sm: "h-11 px-4 text-label gap-2",
  md: "h-12 px-5 text-body gap-2",
  lg: "h-14 px-6 text-input gap-3",
};

const variantStyles = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 active:scale-[0.97] shadow-subtle",
  secondary: "bg-slate-600 text-white hover:bg-slate-700 active:scale-[0.97] shadow-subtle",
  outline: "bg-transparent text-teal-700 border border-border hover:bg-teal-50 active:scale-[0.97]",
  ghost: "bg-transparent text-ink hover:bg-slate-100 active:scale-[0.97]",
  danger: "bg-danger text-white hover:bg-danger-dark active:scale-[0.97] shadow-subtle",
  text: "bg-transparent text-teal-700 hover:underline",
};

export default function Button({
  children, variant = "primary", size = "md", loading = false,
  disabled = false, fullWidth = true, icon, className = "", onClick, type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-lg font-semibold",
        "transition-all duration-fast",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
