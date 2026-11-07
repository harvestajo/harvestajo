"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { useTransaction } from "@/hooks/useTransaction";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardBody } from "./ui/Card";
import { NairaDisplay } from "./NairaDisplay";
import { cn } from "@/lib/utils";
import {
  formatUsdc,
  formatNaira,
  USDC_STROOPS_PER_UNIT,
} from "@harvestajo/shared";
import { DEFAULT_NGN_PER_USD, NETWORK } from "@/lib/config";

const steps = ["Amount", "Members", "Review"] as const;

export function CreateFieldWizard() {
  const router = useRouter();
  const { address, signer } = useWallet();
  const { submit } = useTransaction();

  const [step, setStep] = useState(0);
  const [usdcAmount, setUsdcAmount] = useState("");
  const [maxMembers, setMaxMembers] = useState("10");
  const [cycleDays, setCycleDays] = useState("30");

  const usdc = parseFloat(usdcAmount) || 0;
  const stroops = Math.round(usdc * USDC_STROOPS_PER_UNIT);
  const members = parseInt(maxMembers) || 0;
  const days = parseInt(cycleDays) || 0;
  const potUsdc = usdc * members;
  const potNaira = potUsdc * DEFAULT_NGN_PER_USD;
  const perSeasonNaira = usdc * DEFAULT_NGN_PER_USD;
  const totalDays = members * days;

  const canNext =
    (step === 0 && usdc > 0) ||
    (step === 1 && members >= 2 && days > 0) ||
    step === 2;

  async function handleDeploy() {
    if (!address || !signer || !NETWORK.factoryContract) return;

    const result = await submit(
      async () => {
        const { HarvestAjoClient } = await import("@harvestajo/sdk");
        const client = HarvestAjoClient.testnet(
          NETWORK.usdcContract,
          NETWORK.factoryContract,
          NETWORK.yieldContract,
        );
        const deployed = await client.factory!.deployField(
          address,
          NETWORK.usdcContract,
          stroops,
          members,
          days * 86400,
          signer,
        );
        // Adapt to TxResult shape expected by useTransaction
        return { hash: deployed.txHash, status: "SUCCESS" as const, fieldAddress: deployed.address };
      },
      {
        preparing: "Opening wallet to sign...",
        submitting: "Deploying your field to Stellar...",
        success: "Field created! Redirecting...",
        error: "Failed to create field",
      },
    );

    if (result) {
      const fieldAddr = (result as any).fieldAddress;
      if (fieldAddr) router.push(`/fields/${fieldAddr}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step > i && "bg-field-500 text-white",
                  step === i &&
                    "bg-harvest-500 text-white ring-4 ring-harvest-200",
                  step < i && "bg-harvest-100 text-soil-300",
                )}
              >
                {step > i ? "\u2713" : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  step === i ? "text-soil-800" : "text-soil-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-colors",
                  step > i ? "bg-field-400" : "bg-harvest-200",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="animate-fade-in">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-soil-800 mb-1">
                How much per season?
              </h2>
              <p className="text-sm text-soil-500 mb-4">
                Each planter contributes this amount of USDC every season.
                Members deposit Naira — it converts to USDC automatically.
              </p>
            </div>
            <Input
              label="Contribution per season (USDC)"
              type="number"
              step="0.01"
              min="0"
              placeholder="33.00"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              prefix="$"
              hint="This is what each member pays per round"
            />
            {usdc > 0 && (
              <div className="p-4 rounded-xl bg-harvest-50 border border-harvest-200 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-soil-600">
                    In Naira (at {"\u20a6"}{DEFAULT_NGN_PER_USD}/$)
                  </span>
                  <span className="text-lg font-semibold text-soil-800">
                    {formatNaira(stroops, DEFAULT_NGN_PER_USD)}
                  </span>
                </div>
                <p className="text-xs text-soil-400 mt-2">
                  Members save in dollars, deposit in Naira. Dollar savings
                  protects against Naira devaluation.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-soil-800 mb-1">
                Field size & rhythm
              </h2>
              <p className="text-sm text-soil-500 mb-4">
                More members means a bigger pot but a longer commitment.
                The cycle length is how long members have to contribute each round.
              </p>
            </div>
            <Input
              label="Number of planters"
              type="number"
              min="2"
              max="50"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              hint="Each planter harvests the pot once — so 10 members = 10 seasons"
            />
            <Input
              label="Season length (days)"
              type="number"
              min="1"
              value={cycleDays}
              onChange={(e) => setCycleDays(e.target.value)}
              hint="Time each planter has to contribute before the deadline"
            />
            {members >= 2 && days > 0 && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <div className="p-3 rounded-lg bg-field-50 border border-field-200">
                  <p className="text-xs text-field-600">Total field duration</p>
                  <p className="text-lg font-semibold text-field-700">
                    {totalDays} days
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-harvest-50 border border-harvest-200">
                  <p className="text-xs text-harvest-600">Pot per season</p>
                  <p className="text-lg font-semibold text-harvest-700">
                    {formatUsdc(Math.round(stroops * members))}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-soil-800 mb-1">
                Review your field
              </h2>
              <p className="text-sm text-soil-500 mb-4">
                Make sure everything looks right. You&apos;ll be the organizer —
                you set who harvests in which season after creating.
              </p>
            </div>
            <Card>
              <CardBody className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-harvest-100">
                  <span className="text-sm text-soil-500">Contribution</span>
                  <div className="text-right">
                    <div className="font-semibold text-soil-800">
                      {formatUsdc(stroops)} USDC
                    </div>
                    <div className="text-xs text-soil-400">
                      {"\u2248 "}
                      {formatNaira(stroops, DEFAULT_NGN_PER_USD)} / season
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-harvest-100">
                  <span className="text-sm text-soil-500">Planters</span>
                  <span className="font-semibold text-soil-800">{members}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-harvest-100">
                  <span className="text-sm text-soil-500">Seasons</span>
                  <span className="font-semibold text-soil-800">{members}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-harvest-100">
                  <span className="text-sm text-soil-500">Season length</span>
                  <span className="font-semibold text-soil-800">{days} days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-harvest-100">
                  <span className="text-sm text-soil-500">Total duration</span>
                  <span className="font-semibold text-soil-800">
                    {totalDays} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-soil-500">Pot per season</span>
                  <div className="text-right">
                    <div className="font-bold text-harvest-600">
                      {formatUsdc(stroops * members)} USDC
                    </div>
                    <div className="text-xs text-soil-400">
                      {"\u2248 "}
                      {formatNaira(stroops * members, DEFAULT_NGN_PER_USD)}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
            <div className="p-4 rounded-lg bg-field-50 border border-field-200 flex items-start gap-3">
              <span className="text-lg">{"\u2139}"}</span>
              <p className="text-sm text-field-700">
                After creating, you&apos;ll set the harvest order — which member
                harvests the pot in which season. You can take the first harvest
                or distribute however your group agrees.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-10">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {step < 2 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="harvest"
            onClick={handleDeploy}
            disabled={!address || !NETWORK.factoryContract}
          >
            {!address
              ? "Connect wallet first"
              : !NETWORK.factoryContract
                ? "Configure factory address"
                : "\u{1F33E} Plant the Field"}
          </Button>
        )}
      </div>
    </div>
  );
}
