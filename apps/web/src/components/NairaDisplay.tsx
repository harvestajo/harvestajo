"use client";

import { cn } from "@/lib/utils";
import { formatUsdc, formatNaira } from "@harvestajo/shared";
import { DEFAULT_NGN_PER_USD } from "@/lib/config";

interface NairaDisplayProps {
  stroops: number;
  ngnPerUsd?: number;
  nairaOnly?: boolean;
  usdcOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { usdc: "text-base font-semibold", naira: "text-xs" },
  md: { usdc: "text-lg font-semibold", naira: "text-sm" },
  lg: { usdc: "text-2xl font-bold", naira: "text-sm" },
};

export function NairaDisplay({
  stroops,
  ngnPerUsd = DEFAULT_NGN_PER_USD,
  nairaOnly = false,
  usdcOnly = false,
  size = "md",
  className,
}: NairaDisplayProps) {
  const cls = sizeClasses[size];
  return (
    <div className={cn("flex flex-col", className)}>
      {!nairaOnly && (
        <span className={cn(cls.usdc, "text-soil-800")}>
          {formatUsdc(stroops)}
        </span>
      )}
      {!usdcOnly && (
        <span className={cn(cls.naira, "text-soil-500")}>
          {"\u2248 "}
          {formatNaira(stroops, ngnPerUsd)}
        </span>
      )}
    </div>
  );
}
