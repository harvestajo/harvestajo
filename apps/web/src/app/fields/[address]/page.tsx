"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { useTransaction } from "@/hooks/useTransaction";
import { NETWORK, DEFAULT_NGN_PER_USD } from "@/lib/config";
import { cn, truncateAddress, addressColor } from "@/lib/utils";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/Feedback";
import { NairaDisplay } from "@/components/NairaDisplay";
import { SeasonProgress } from "@/components/SeasonProgress";
import { FieldTimeline } from "@/components/FieldTimeline";
import { MemberRoster } from "@/components/MemberRoster";
import { formatUsdc, formatNaira, statusLabel } from "@harvestajo/shared";
import type { FieldInfo } from "@harvestajo/shared";

export default function FieldDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const fieldAddress = params.address;
  const { address: walletAddress, signer } = useWallet();
  const { submit } = useTransaction();

  const [field, setField] = useState<FieldInfo | null>(null);
  const [plantedMembers, setPlantedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPlantModal, setShowPlantModal] = useState(false);

  useEffect(() => {
    async function loadField() {
      if (!fieldAddress || !NETWORK.usdcContract) {
        setLoading(false);
        return;
      }
      try {
        const { HarvestAjoClient } = await import("@harvestajo/sdk");
        const client = HarvestAjoClient.testnet(NETWORK.usdcContract);
        const f = client.fieldAt(fieldAddress);
        setField(await f.getInfo());
        setPlantedMembers(await f.getPlantedMembers());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadField();
  }, [fieldAddress]);

  async function handleJoin() {
    if (!walletAddress || !signer) return;
    setShowJoinModal(false);
    await submit(
      async () => {
        const { HarvestAjoClient } = await import("@harvestajo/sdk");
        const client = HarvestAjoClient.testnet(NETWORK.usdcContract);
        return client.fieldAt(fieldAddress).join(walletAddress, signer);
      },
      {
        preparing: "Opening wallet...",
        submitting: "Joining the field...",
        success: "You\u2019ve joined the field!",
        error: "Failed to join",
      },
    );
  }

  async function handlePlant() {
    if (!walletAddress || !signer) return;
    setShowPlantModal(false);
    await submit(
      async () => {
        const { HarvestAjoClient } = await import("@harvestajo/sdk");
        const client = HarvestAjoClient.testnet(NETWORK.usdcContract);
        const f = client.fieldAt(fieldAddress);
        await f.approveUsdc(walletAddress, signer);
        return f.plant(walletAddress, signer);
      },
      {
        preparing: "Approving USDC...",
        submitting: "Planting your contribution...",
        success: "Planted! Your USDC is in the field.",
        error: "Failed to plant",
      },
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-48" />
        <Card className="p-5">
          <div className="skeleton h-12 w-32 mb-4" />
          <div className="skeleton h-4 w-full" />
        </Card>
        <Card className="p-5">
          <div className="skeleton h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (!field) {
    return (
      <EmptyState
        icon={"\u{1F33E}"}
        title="Field not found"
        description={
          NETWORK.usdcContract
            ? "Make sure the address is correct."
            : "Contracts not configured. Set addresses in src/lib/config.ts."
        }
        action={
          <Link href="/">
            <Button variant="secondary">Back to fields</Button>
          </Link>
        }
      />
    );
  }

  const isMember = walletAddress && field.members.includes(walletAddress);
  const hasPlanted = walletAddress && plantedMembers.includes(walletAddress);
  const nextHarvesterIdx =
    field.status === "Active" &&
    field.harvestOrder.length > field.currentSeason
      ? field.harvestOrder[field.currentSeason]
      : null;
  const nextHarvester =
    nextHarvesterIdx !== null ? field.members[nextHarvesterIdx] : null;
  const potStroops = field.contributionAmount * field.maxMembers;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"\u{1F33E}"}</span>
          <div>
            <h1 className="text-lg font-bold text-soil-800 font-mono">
              {truncateAddress(fieldAddress, 8, 6)}
            </h1>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${fieldAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-soil-400 hover:text-field-600"
            >
              View on Stellar Expert {"\u2197"}
            </a>
          </div>
        </div>
        <Badge
          variant={
            field.status === "Active" ? "field" : field.status === "Open" ? "harvest" : "neutral"
          }
        >
          {statusLabel(field.status)}
        </Badge>
      </div>

      {/* Contribution summary */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-soil-400 mb-1">Per season</p>
              <NairaDisplay stroops={field.contributionAmount} size="lg" />
            </div>
            <div>
              <p className="text-xs text-soil-400 mb-1">Pot per season</p>
              <div className="text-2xl font-bold text-harvest-600">
                {formatUsdc(potStroops)}
              </div>
              <div className="text-sm text-soil-400">
                {"\u2248 "}
                {formatNaira(potStroops, DEFAULT_NGN_PER_USD)}
              </div>
            </div>
            <div>
              <p className="text-xs text-soil-400 mb-1">Planters</p>
              <div className="text-2xl font-bold text-soil-800">
                {field.members.length} / {field.maxMembers}
              </div>
              <div className="text-sm text-soil-400">
                {field.maxMembers} seasons total
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Season timeline (only when active) */}
      {field.status === "Active" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-soil-800 text-sm">Season Timeline</h2>
          </CardHeader>
          <CardBody>
            <FieldTimeline
              totalSeasons={field.maxMembers}
              currentSeason={field.currentSeason}
              members={field.members}
              harvestOrder={field.harvestOrder}
            />
            <div className="mt-5 pt-4 border-t border-harvest-100">
              <SeasonProgress
                currentSeason={field.currentSeason}
                totalSeasons={field.maxMembers}
                nextHarvester={nextHarvester ?? undefined}
                seasonStart={field.seasonStart || undefined}
                cycleSeconds={field.cycleSeconds || undefined}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Member roster */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-soil-800 text-sm">
            Planters ({field.members.length} / {field.maxMembers})
          </h2>
        </CardHeader>
        <CardBody>
          {field.members.length > 0 ? (
            <MemberRoster
              members={field.members}
              plantedMembers={plantedMembers}
              harvestOrder={field.harvestOrder}
              currentSeason={field.currentSeason}
              defaults={field.defaults}
              status={field.status}
              walletAddress={walletAddress}
            />
          ) : (
            <p className="text-sm text-soil-400 text-center py-6">
              No planters yet. Be the first to join.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Action area */}
      {walletAddress && (
        <Card>
          <CardBody className="space-y-3">
            {field.status === "Open" && !isMember && (
              <>
                <p className="text-sm text-soil-600">
                  This field is open for planters. Join to reserve your spot.
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => setShowJoinModal(true)}
                >
                  {"\u{1F331}"} Join this field
                </Button>
              </>
            )}

            {field.status === "Active" && isMember && !hasPlanted && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-harvest-50 border border-harvest-200">
                  <span className="text-lg">{"\u23f3}"}</span>
                  <p className="text-sm text-soil-600">
                    You haven\u2019t planted this season. Approve USDC spending
                    and plant your contribution of{" "}
                    <strong>{formatUsdc(field.contributionAmount)}</strong>.
                  </p>
                </div>
                <Button
                  variant="harvest"
                  fullWidth
                  size="lg"
                  onClick={() => setShowPlantModal(true)}
                >
                  {"\u{1F331}"} Plant {formatUsdc(field.contributionAmount)}
                </Button>
              </>
            )}

            {field.status === "Active" && isMember && hasPlanted && (
              <div className="flex items-center justify-center gap-2 py-2 text-field-600">
                <span className="text-lg">{"\u2713}"}</span>
                <span className="text-sm font-medium">
                  You\u2019ve planted this season. Waiting for others.
                </span>
              </div>
            )}

            {!isMember && field.status === "Active" && (
              <p className="text-sm text-soil-400 text-center py-2">
                You\u2019re not a member of this field.
              </p>
            )}

            {field.status === "Closed" && (
              <p className="text-sm text-soil-400 text-center py-2">
                This field has completed all seasons.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <Modal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join this field?"
        confirmLabel="Join"
        onConfirm={handleJoin}
      >
        You\u2019re joining a {field.maxMembers}-member field contributing{" "}
        <strong>{formatUsdc(field.contributionAmount)}</strong> per season
        ({"\u2248"} {formatNaira(field.contributionAmount, DEFAULT_NGN_PER_USD)}).
        You\u2019ll need to plant each season until the field completes.
      </Modal>

      <Modal
        open={showPlantModal}
        onClose={() => setShowPlantModal(false)}
        title="Plant your contribution?"
        confirmLabel="Plant"
        confirmVariant="harvest"
        onConfirm={handlePlant}
      >
        You\u2019re planting <strong>{formatUsdc(field.contributionAmount)}</strong>{" "}
        USDC ({"\u2248"} {formatNaira(field.contributionAmount, DEFAULT_NGN_PER_USD)})
        for season {field.currentSeason + 1}. This will first approve the
        contract to spend your USDC, then submit your contribution.
      </Modal>
    </div>
  );
}
