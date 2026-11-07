"use client";

import { cn } from "@/lib/utils";
import { Progress } from "./ui/Feedback";
import { seasonLabel, formatCountdown, secondsRemaining } from "@harvestajo/shared";

interface SeasonProgressProps {
  currentSeason: number;
  totalSeasons: number;
  nextHarvester?: string;
  seasonStart?: number;
  cycleSeconds?: number;
}

export function SeasonProgress({
  currentSeason,
  totalSeasons,
  nextHarvester,
  seasonStart,
  cycleSeconds,
}: SeasonProgressProps) {
  const remaining =
    seasonStart && cycleSeconds
      ? secondsRemaining(seasonStart, cycleSeconds)
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-soil-700">
          {seasonLabel(currentSeason, totalSeasons)}
        </span>
        <span className="text-soil-500">
          {currentSeason} / {totalSeasons} harvested
        </span>
      </div>

      <Progress
        value={currentSeason}
        max={totalSeasons}
        color="harvest"
        className="h-3"
      />

      {/* Season timeline dots */}
      <div className="flex items-center justify-between gap-1 pt-1">
        {Array.from({ length: totalSeasons }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-2 rounded-full transition-colors duration-300",
              i < currentSeason
                ? "bg-field-500"
                : i === currentSeason
                  ? "bg-harvest-500 animate-pulse-soft"
                  : "bg-harvest-100",
            )}
            title={`Season ${i + 1}${i < currentSeason ? " (harvested)" : i === currentSeason ? " (current)" : " (upcoming)"}`}
          />
        ))}
      </div>

      {/* Next harvester + deadline */}
      {(nextHarvester || remaining > 0) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-harvest-100">
          {nextHarvester && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-soil-500">Next harvest</span>
              <span className="font-mono text-field-600">
                {nextHarvester.slice(0, 8)}...{nextHarvester.slice(-4)}
              </span>
            </div>
          )}
          {remaining > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-soil-500">Time remaining</span>
              <span
                className={cn(
                  "font-medium",
                  remaining < 86400 ? "text-harvest-600" : "text-soil-600",
                )}
              >
                {formatCountdown(remaining)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
