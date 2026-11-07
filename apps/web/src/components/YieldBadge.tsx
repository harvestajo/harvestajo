"use client";

import { cn } from "@/lib/utils";

interface YieldBadgeProps {
  score: number;
  completed: number;
  defaults: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { svg: 48, r: 20, stroke: 3, font: 14, gap: "gap-2" },
  md: { svg: 64, r: 28, stroke: 4, font: 18, gap: "gap-3" },
  lg: { svg: 80, r: 36, stroke: 4, font: 24, gap: "gap-4" },
};

function scoreColor(score: number): string {
  if (score >= 50) return "#2D5C3F";
  if (score >= 30) return "#D4A03C";
  if (score >= 10) return "#EFCC74";
  if (score > 0) return "#C2A99B";
  return "#DC2626";
}

export function YieldBadge({
  score,
  completed,
  defaults,
  size = "md",
}: YieldBadgeProps) {
  const s = sizeMap[size];
  const color = scoreColor(score);
  const maxScore = 100;
  const pct = Math.min(score / maxScore, 1);
  const circumference = 2 * Math.PI * s.r;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className={cn("flex items-center", s.gap)}>
      {/* Circular gauge */}
      <div className="relative flex-shrink-0">
        <svg
          width={s.svg}
          height={s.svg}
          viewBox={`0 0 ${s.svg} ${s.svg}`}
          aria-label={`Yield score: ${score}`}
        >
          {/* Track */}
          <circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.r}
            fill="none"
            stroke="#F5DEA7"
            strokeWidth={s.stroke}
          />
          {/* Progress */}
          <circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.r}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${s.svg / 2} ${s.svg / 2})`}
            style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
          />
        </svg>
        {/* Score text overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ color, fontSize: s.font }}
        >
          {score}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        <span className="text-soil-700 font-medium text-sm">
          {completed} harvested
        </span>
        {defaults > 0 ? (
          <span className="text-red-600 text-sm">{defaults} defaults</span>
        ) : (
          <span className="text-field-600 text-xs">no defaults</span>
        )}
        <span className="text-xs text-soil-400 mt-0.5">Yield score</span>
      </div>
    </div>
  );
}
