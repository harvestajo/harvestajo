import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skeleton — loading placeholder with shimmer
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

// ---------------------------------------------------------------------------
// Progress — animated bar
// ---------------------------------------------------------------------------

interface ProgressProps {
  value: number;
  max?: number;
  color?: "harvest" | "field";
  className?: string;
}

export function Progress({
  value,
  max = 100,
  color = "harvest",
  className,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn("h-2 rounded-full overflow-hidden bg-harvest-100", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          color === "harvest"
            ? "bg-gradient-to-r from-harvest-400 to-harvest-500"
            : "bg-gradient-to-r from-field-400 to-field-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — designed empty state with icon, text, and CTA
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-4 text-5xl">{icon}</div>
      <h3 className="text-lg font-semibold text-soil-700 mb-1">{title}</h3>
      <p className="text-sm text-soil-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat — metric card
// ---------------------------------------------------------------------------

interface StatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "default" | "field" | "harvest" | "danger";
}

const statAccent = {
  default: "text-soil-800",
  field: "text-field-600",
  harvest: "text-harvest-600",
  danger: "text-red-600",
};

export function Stat({ label, value, icon, accent = "default" }: StatProps) {
  return (
    <div className="p-4 bg-white rounded-xl border border-harvest-200 text-center">
      {icon && <div className="mb-1 text-xl">{icon}</div>}
      <div className={cn("text-2xl font-bold", statAccent[accent])}>{value}</div>
      <div className="text-xs text-soil-500 mt-1">{label}</div>
    </div>
  );
}
