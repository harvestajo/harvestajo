/**
 * @harvestajo/shared — types, constants, and formatting utilities shared
 * across the HarvestAjo SDK and web app.
 *
 * The harvest metaphor is the vocabulary of the entire product:
 *   Field   = a savings circle (ROSCA)
 *   Plant   = contribute USDC for the current season
 *   Harvest = receive the pot
 *   Season  = one round in the rotation
 *   Yield   = on-chain reputation score
 *   Planter = a member of a field
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FieldStatus = "Open" | "Active" | "Closed";

export interface FieldInfo {
  address: string;
  admin: string;
  usdc: string;
  contributionAmount: number; // USDC stroops (1 USDC = 10_000_000 stroops)
  maxMembers: number;
  currentSeason: number;
  status: FieldStatus;
  cycleSeconds: number;
  seasonStart: number; // Unix timestamp
  members: string[];
  harvestOrder: number[];
  defaults: number[];
}

export interface YieldStats {
  score: number;
  completed: number;
  defaults: number;
}

export interface FieldEventData {
  fieldAddress: string;
  season: number;
  member: string;
  amount: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** USDC on Stellar uses 7 decimal places (like XLM). */
export const USDC_DECIMALS = 7;
export const USDC_STROOPS_PER_UNIT = 10_000_000;

/** Stellar testnet passphrase. */
export const TESTNET_PASSPHRASE =
  "Test SDF Network ; September 2015";

/** Stellar mainnet passphrase. */
export const MAINNET_PASSPHRASE =
  "Public Global Stellar Network ; September 2015";

/** Harvest-themed UI labels. */
export const HARVEST_LABELS = {
  field: "Field",
  fieldPlural: "Fields",
  plant: "Plant",
  harvest: "Harvest",
  season: "Season",
  yield: "Yield",
  planter: "Planter",
  planterPlural: "Planters",
} as const;

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------

/** Convert USDC stroops to a display string like "$33.33". */
export function formatUsdc(stroops: number): string {
  const usdc = stroops / USDC_STROOPS_PER_UNIT;
  return `$${usdc.toFixed(2)}`;
}

/** Convert USDC stroops to Naira at a given exchange rate. */
export function formatNaira(stroops: number, ngnPerUsd: number): string {
  const usdc = stroops / USDC_STROOPS_PER_UNIT;
  const naira = usdc * ngnPerUsd;
  return `\u20a6${naira.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Convert a raw USDC amount (in whole units, not stroops) to Naira. */
export function usdcToNaira(usdcAmount: number, ngnPerUsd: number): number {
  return usdcAmount * ngnPerUsd;
}

/** Format a season label like "Season 3 of 10". */
export function seasonLabel(season: number, total: number): string {
  return `Season ${season + 1} of ${total}`;
}

/** Human-readable field status. */
export function statusLabel(status: FieldStatus): string {
  switch (status) {
    case "Open":
      return "Accepting Planters";
    case "Active":
      return "Growing";
    case "Closed":
      return "Harvest Complete";
  }
}

/** Format a timestamp as a short date string. */
export function formatDeadline(seasonStart: number, cycleSeconds: number): string {
  const deadline = seasonStart + cycleSeconds;
  const date = new Date(deadline * 1000);
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Calculate seconds remaining until the current season deadline. */
export function timeRemaining(seasonStart: number, cycleSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  const deadline = seasonStart + cycleSeconds;
  return Math.max(0, deadline - now);
}

/** Format seconds remaining as "3d 4h" or "2h 15m" or "5m". */
export function formatTimeRemaining(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------------------------------------------------------------------------
// Aliases used by UI components
// ---------------------------------------------------------------------------

/** Alias for timeRemaining — seconds until the season deadline. */
export const secondsRemaining = timeRemaining;

/** Alias for formatTimeRemaining — formats as "3d 4h" / "2h 15m" / "5m". */
export const formatCountdown = formatTimeRemaining;
