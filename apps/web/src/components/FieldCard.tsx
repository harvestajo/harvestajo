"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { Progress } from "./ui/Feedback";
import { NairaDisplay } from "./NairaDisplay";
import { formatUsdc, formatNaira, statusLabel } from "@harvestajo/shared";
import { DEFAULT_NGN_PER_USD } from "@/lib/config";
import type { FieldInfo } from "@harvestajo/shared";

interface FieldCardProps {
  field: FieldInfo;
}

export function FieldCard({ field }: FieldCardProps) {
  const memberPct =
    field.maxMembers > 0 ? (field.members.length / field.maxMembers) * 100 : 0;

  const statusVariant =
    field.status === "Active"
      ? ("field" as const)
      : field.status === "Open"
        ? ("harvest" as const)
        : ("neutral" as const);

  return (
    <Link href={`/fields/${field.address}`} className="block">
      <Card hover className="p-5 h-full">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{"\u{1F33E}"}</span>
            <span className="font-mono text-xs text-soil-500">
              {field.address.slice(0, 8)}...{field.address.slice(-4)}
            </span>
          </div>
          <Badge variant={statusVariant}>{statusLabel(field.status)}</Badge>
        </div>

        {/* Contribution */}
        <div className="mb-4">
          <NairaDisplay stroops={field.contributionAmount} size="lg" />
          <p className="text-xs text-soil-400 mt-1">per planter, per season</p>
        </div>

        {/* Pot preview */}
        <div className="mb-4 p-3 rounded-lg bg-harvest-50 border border-harvest-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-soil-500">Pot per season</span>
            <span className="font-semibold text-soil-700">
              {formatUsdc(field.contributionAmount * field.maxMembers)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-soil-400">{"\u2248 in Naira"}</span>
            <span className="text-soil-500">
              {formatNaira(field.contributionAmount * field.maxMembers, DEFAULT_NGN_PER_USD)}
            </span>
          </div>
        </div>

        {/* Member fill bar — the field growing */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-soil-600">
            {field.members.length} / {field.maxMembers} planters
          </span>
          {field.status === "Active" && (
            <span className="text-xs text-field-600">
              Season {field.currentSeason + 1} of {field.maxMembers}
            </span>
          )}
        </div>
        <Progress
          value={field.members.length}
          max={field.maxMembers}
          color={field.status === "Active" ? "field" : "harvest"}
        />

        {/* Defaults warning */}
        {field.defaults.length > 0 && (
          <div className="mt-3">
            <Badge variant="danger">
              {field.defaults.length} default{field.defaults.length > 1 ? "s" : ""}
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  );
}
