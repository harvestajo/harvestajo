import { cn } from "@/lib/utils";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "field"
  | "harvest";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-field-100 text-field-700",
  warning: "bg-harvest-100 text-harvest-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-soil-100 text-soil-600",
  field: "bg-field-100 text-field-700",
  harvest: "bg-harvest-100 text-harvest-700",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
