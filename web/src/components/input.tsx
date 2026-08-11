import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
}

export default function Input({
  label, error, hint, leftIcon, rightIcon, multiline, className = "", id, ...rest
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full mb-3">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body font-medium text-ink mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        {multiline ? (
          <textarea
            id={inputId}
            className={[
              "w-full rounded-lg px-4 py-3 text-input text-ink",
              "border-2 transition-all duration-fast",
              "placeholder:text-slate-400",
              error
                ? "border-danger bg-danger-bg"
                : "border-border bg-white focus:border-teal-600 focus:outline-none",
              leftIcon ? "pl-12" : "",
              rightIcon ? "pr-12" : "",
              className,
            ].join(" ")}
            {...(rest as any)}
          />
        ) : (
          <input
            id={inputId}
            className={[
              "w-full rounded-lg px-4 py-3 text-input text-ink",
              "border-2 transition-all duration-fast",
              "placeholder:text-slate-400",
              error
                ? "border-danger bg-danger-bg"
                : "border-border bg-white focus:border-teal-600 focus:outline-none",
              leftIcon ? "pl-12" : "",
              rightIcon ? "pr-12" : "",
              className,
            ].join(" ")}
            {...rest}
          />
        )}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="mt-1 text-label text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-label text-danger flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
