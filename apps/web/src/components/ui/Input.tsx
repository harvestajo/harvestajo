"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-soil-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-soil-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full px-4 py-3 text-soil-800 bg-white border rounded-lg",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-field-500 focus:border-field-500",
            "placeholder:text-soil-300",
            prefix && "pl-8",
            suffix && "pr-12",
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-harvest-300 hover:border-harvest-400",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-soil-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-soil-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
