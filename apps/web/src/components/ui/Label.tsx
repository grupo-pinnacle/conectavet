"use client";

import { forwardRef, LabelHTMLAttributes } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", required, children, ...props }, ref) => (
    <label ref={ref} className={`block text-sm font-medium text-ink-soft mb-1.5 ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  )
);
Label.displayName = "Label";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, placeholder, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-[var(--radius-md)] border px-3 py-2 text-ink bg-white appearance-none
            ${error ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-brand"}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-surface disabled:cursor-not-allowed`}
          aria-invalid={error ? "true" : "false"}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";