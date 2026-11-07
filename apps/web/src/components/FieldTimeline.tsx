"use client";

import { cn, truncateAddress } from "@/lib/utils";

interface FieldTimelineProps {
  totalSeasons: number;
  currentSeason: number;
  members: string[];
  harvestOrder: number[];
}

/**
 * Horizontal visual timeline showing each season and who harvests.
 * Completed seasons are green, current is gold, future is muted.
 */
export function FieldTimeline({
  totalSeasons,
  currentSeason,
  members,
  harvestOrder,
}: FieldTimelineProps) {
  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-2">
      {Array.from({ length: totalSeasons }).map((_, i) => {
        const memberIdx = harvestOrder[i];
        const member = memberIdx !== undefined ? members[memberIdx] : null;
        const isCompleted = i < currentSeason;
        const isCurrent = i === currentSeason;
        const isFuture = i > currentSeason;

        return (
          <div key={i} className="flex flex-col items-center min-w-[60px]">
            {/* Node */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                isCompleted && "bg-field-500 text-white shadow-sm",
                isCurrent &&
                  "bg-harvest-500 text-white ring-4 ring-harvest-200 animate-pulse-soft",
                isFuture && "bg-harvest-100 text-soil-300",
              )}
            >
              {isCompleted ? (
                "\u2713"
              ) : isCurrent ? (
                "\u{1F33E}"
              ) : (
                i + 1
              )}
            </div>

            {/* Connector line */}
            {i < totalSeasons - 1 && (
              <div
                className={cn(
                  "h-0.5 w-full -mt-5 mb-3",
                  i < currentSeason ? "bg-field-400" : "bg-harvest-100",
                )}
                style={{ position: "relative", zIndex: -1 }}
              />
            )}

            {/* Harvester address */}
            <div className="mt-2 text-center">
              {member && (
                <p
                  className={cn(
                    "text-[10px] font-mono",
                    isCompleted ? "text-field-600" : isCurrent ? "text-harvest-700 font-medium" : "text-soil-300",
                  )}
                >
                  {truncateAddress(member, 2, 2)}
                </p>
              )}
              <p
                className={cn(
                  "text-[9px] mt-0.5",
                  isCompleted ? "text-field-400" : isCurrent ? "text-harvest-500" : "text-soil-200",
                )}
              >
                {isCompleted ? "done" : isCurrent ? "now" : "soon"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
