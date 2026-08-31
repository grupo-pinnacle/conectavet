"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft mb-1.5">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-ink placeholder:text-ink-soft/50 transition-colors
            ${error ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-brand"}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-surface disabled:cursor-not-allowed`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500" role="alert">{error}</p>}
        {helperText && !error && <p id={`${inputId}-helper`} className="mt-1 text-sm text-ink-soft">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "label" | "error" | "helperText"> & { label?: string; error?: string; helperText?: string }>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-ink placeholder:text-ink-soft/50 transition-colors resize-y min-h-[80px]
            ${error ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-brand"}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-surface disabled:cursor-not-allowed`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-red-500" role="alert">{error}</p>}
        {helperText && !error && <p id={`${inputId}-helper`} className="mt-1 text-sm text-ink-soft">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";