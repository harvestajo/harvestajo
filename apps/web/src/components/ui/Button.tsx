"use client";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "harvest";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-field-600 text-white hover:bg-field-700 active:bg-field-800 shadow-sm",
  secondary:
    "bg-white text-soil-700 border border-harvest-300 hover:bg-harvest-50 hover:border-harvest-400",
  ghost: "text-soil-600 hover:bg-harvest-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
  harvest:
    "bg-harvest-500 text-white hover:bg-harvest-600 active:bg-harvest-700 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin-slow h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
