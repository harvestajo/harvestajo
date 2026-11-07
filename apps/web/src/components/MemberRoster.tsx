"use client";

import Link from "next/link";
import { cn, truncateAddress, addressColor } from "@/lib/utils";
import { Badge } from "./ui/Badge";

interface MemberRosterProps {
  members: string[];
  plantedMembers: string[];
  harvestOrder: number[];
  currentSeason: number;
  defaults: number[];
  status: "Open" | "Active" | "Closed";
  walletAddress?: string | null;
}

export function MemberRoster({
  members,
  plantedMembers,
  harvestOrder,
  currentSeason,
  defaults,
  status,
  walletAddress,
}: MemberRosterProps) {
  // Build a map of member index → harvest season.
  const harvestSeasonOf: Record<number, number> = {};
  harvestOrder.forEach((memberIdx, season) => {
    harvestSeasonOf[memberIdx] = season;
  });

  return (
    <div className="space-y-1">
      {members.map((member, idx) => {
        const isPlanted = plantedMembers.includes(member);
        const memberSeason = harvestSeasonOf[idx];
        const hasHarvested =
          status === "Active" && memberSeason !== undefined && memberSeason < currentSeason;
        const isCurrentHarvester =
          status === "Active" && memberSeason === currentSeason;
        const isDefault = defaults.includes(idx);
        const isYou = member === walletAddress;

        return (
          <div
            key={member}
            className={cn(
              "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors",
              isCurrentHarvester
                ? "bg-harvest-50 ring-1 ring-harvest-300"
                : "hover:bg-harvest-50/50",
            )}
          >
            {/* Address */}
            <div className="flex items-center gap-3">
              {/* Avatar dot */}
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono text-white flex-shrink-0"
                style={{ backgroundColor: addressColor(member) }}
              >
                {member.slice(-2)}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/yield/${member}`}
                  className="font-mono text-sm text-field-600 hover:underline"
                >
                  {truncateAddress(member)}
                </Link>
                {isYou && (
                  <Badge variant="field" className="text-[10px] py-0.5">
                    you
                  </Badge>
                )}
                {isCurrentHarvester && (
                  <Badge variant="harvest" className="text-[10px] py-0.5">
                    harvesting now
                  </Badge>
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-1.5">
              {hasHarvested && (
                <Badge variant="field" className="text-[10px] py-0.5">
                  {"\u{1F33E}"} harvested
                </Badge>
              )}
              {isPlanted && !hasHarvested && (
                <Badge variant="success" className="text-[10px] py-0.5">
                  {"\u{1F331}"} planted
                </Badge>
              )}
              {isDefault && (
                <Badge variant="danger" className="text-[10px] py-0.5">
                  defaulted
                </Badge>
              )}
              {status === "Active" && !isPlanted && !hasHarvested && !isDefault && (
                <span className="text-xs text-soil-300">waiting...</span>
              )}
              {memberSeason !== undefined && !hasHarvested && !isCurrentHarvester && (
                <span className="text-xs text-soil-400">
                  season {memberSeason + 1}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
