"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { FieldCard } from "@/components/FieldCard";
import { NETWORK } from "@/lib/config";
import type { FieldInfo } from "@harvestajo/shared";

const steps = [
  {
    icon: "\u{1F331}",
    title: "1. Plant",
    description:
      "Each season, every member plants their USDC contribution into the contract. Naira goes in, dollars go on-chain.",
  },
  {
    icon: "\u{1F33E}",
    title: "2. Harvest",
    description:
      "When all members have planted, the contract auto-pays the pot to the scheduled harvester. No intermediary, no delay.",
  },
  {
    icon: "\u{1F4CA}",
    title: "3. Yield",
    description:
      "Complete a full circle and your on-chain yield score grows. Default and it drops — defaulters can\u2019t join future fields.",
  },
];

export default function HomePage() {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFields() {
      if (!NETWORK.factoryContract) {
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
        const addresses = await client.factory!.getFields();
        const infos = await Promise.all(
          addresses.map((a: string) => client.fieldAt(a).getInfo()),
        );
        setFields(infos);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load fields:", err);
        setLoading(false);
      }
    }
    loadFields();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center pt-8 pb-4">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-field-100 text-field-700 text-sm font-medium">
          Trustless savings on Stellar
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient leading-tight">
          Plant together.
          <br />
          Harvest together.
        </h1>
        <p className="text-lg text-soil-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Rotating savings circles (Ajo / Esusu) on Stellar. Save in dollars,
          contribute via Naira. The smart contract holds the pot — no organizer
          can run off with your money.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/create">
            <Button variant="harvest" size="lg">
              {"\u{1F331}"} Create a Field
            </Button>
          </Link>
          <a href="#fields">
            <Button variant="secondary" size="lg">
              Explore Fields
            </Button>
          </a>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-semibold text-soil-800 mb-4 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <Card key={step.title} className="p-5">
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-soil-800 mb-1">{step.title}</h3>
              <p className="text-sm text-soil-600 leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Fields */}
      <section id="fields">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-soil-800">Active Fields</h2>
          <Link href="/create">
            <Button variant="primary" size="sm">
              + New Field
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="p-5">
                <div className="skeleton h-4 w-20 mb-4" />
                <div className="skeleton h-8 w-32 mb-4" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-2 w-full" />
              </Card>
            ))}
          </div>
        ) : fields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <FieldCard key={field.address} field={field} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={"\u{1F331}"}
            title="No fields yet"
            description={
              NETWORK.factoryContract
                ? "Be the first to plant a field. Create one and invite your circle."
                : "Contracts aren\u2019t deployed yet. Set the addresses in src/lib/config.ts to get started."
            }
            action={
              NETWORK.factoryContract ? (
                <Link href="/create">
                  <Button variant="harvest">Create the first field</Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
