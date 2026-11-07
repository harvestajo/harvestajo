"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NETWORK } from "@/lib/config";
import { cn, truncateAddress, addressColor } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { YieldBadge } from "@/components/YieldBadge";
import type { YieldStats } from "@harvestajo/shared";

export default function YieldPage({
  params,
}: {
  params: { address: string };
}) {
  const memberAddress = params.address;
  const [stats, setStats] = useState<YieldStats | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadYield() {
      if (!memberAddress || !NETWORK.yieldContract) {
        setLoading(false);
        return;
      }
      try {
        const { HarvestAjoClient } = await import("@harvestajo/sdk");
        const client = HarvestAjoClient.testnet(
          NETWORK.usdcContract,
          NETWORK.factoryContract,
          NETWORK.yieldContract,
        );
        setStats(await client.yield!.getStats(memberAddress));
        setHistory(await client.yield!.getHistory(memberAddress));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load yield:", err);
        setLoading(false);
      }
    }
    loadYield();
  }, [memberAddress]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="text-center py-8">
          <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4" />
          <div className="skeleton h-4 w-32 mx-auto" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center py-6">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-lg font-mono"
          style={{ backgroundColor: addressColor(memberAddress) }}
        >
          {memberAddress.slice(-2)}
        </div>
        <h1 className="text-lg font-bold text-soil-800">Yield Profile</h1>
        <p className="font-mono text-sm text-soil-500 mt-1">
          {truncateAddress(memberAddress, 8, 6)}
        </p>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${memberAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-soil-400 hover:text-field-600"
        >
          View on Stellar Expert {"\u2197"}
        </a>
      </div>

      {/* Yield badge */}
      {stats ? (
        <>
          <Card>
            <CardBody className="flex justify-center py-8">
              <YieldBadge
                score={stats.score}
                completed={stats.completed}
                defaults={stats.defaults}
                size="lg"
              />
            </CardBody>
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <Stat
              icon={"\u{1F33E}"}
              label="Fields harvested"
              value={stats.completed}
              accent="field"
            />
            <Stat
              icon={"\u{1F4CA}"}
              label="Yield score"
              value={stats.score}
              accent="harvest"
            />
            <Stat
              label="Defaults"
              value={stats.defaults}
              accent={stats.defaults > 0 ? "danger" : "default"}
            />
          </div>

          {/* History */}
          {history.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-soil-800 text-sm">
                  Event History
                </h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {history.map((event, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 py-2 border-b border-harvest-50 last:border-0"
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                          event === "harvest"
                            ? "bg-field-100 text-field-600"
                            : "bg-red-100 text-red-600",
                        )}
                      >
                        {event === "harvest" ? "\u{1F33E}" : "\u26A0"}
                      </span>
                      <div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            event === "harvest" ? "text-field-700" : "text-red-700",
                          )}
                        >
                          {event === "harvest" ? "Harvested" : "Defaulted"}
                        </span>
                        <span className="text-xs text-soil-400 ml-2">
                          Event #{idx + 1}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : (
            stats.completed === 0 &&
            stats.defaults === 0 && (
              <Card>
                <CardBody className="text-center py-8">
                  <p className="text-soil-400">
                    This planter hasn\u2019t participated in any fields yet.
                  </p>
                </CardBody>
              </Card>
            )
          )}

          {/* Trust indicator */}
          {stats.defaults > 0 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <span className="text-lg">{"\u26A0}"}</span>
              <p className="text-sm text-red-700">
                This wallet has {stats.defaults} default
                {stats.defaults > 1 ? "s" : ""} on record. Organizers should
                consider this before accepting them into a new field.
              </p>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-soil-600 mb-1">No yield data found.</p>
            <p className="text-sm text-soil-400">
              {NETWORK.yieldContract
                ? "This wallet may not have participated in any fields."
                : "Yield contract not configured. Set the address in src/lib/config.ts."}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Back link */}
      <div className="text-center pt-2">
        <Link href="/">
          <Button variant="ghost" size="sm">
            {"\u2190"} Back to fields
          </Button>
        </Link>
      </div>
    </div>
  );
}
