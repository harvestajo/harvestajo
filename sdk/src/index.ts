/**
 * @harvestajo/sdk — trustless rotating savings circles on Stellar.
 *
 * Plant together. Harvest together.
 *
 * @example
 * ```ts
 * import { HarvestAjoClient } from "@harvestajo/sdk";
 *
 * const client = HarvestAjoClient.testnet(usdc, factory, yield);
 * const field = client.fieldAt(fieldAddress);
 * await field.join(myAddress, signer);
 * ```
 */

export { HarvestAjoClient } from "./client";
export { FieldClient } from "./field";
export { FieldFactoryClient } from "./factory";
export { YieldClient } from "./yield";
export { AframpClient, YellowCardRampClient, stroopsToNaira, nairaToStroops } from "./ramp";

export type {
  HarvestAjoConfig,
  Signer,
  FieldStatus,
  FieldInfo,
  YieldStats,
  TxResult,
} from "./types";

export type {
  BankDetails,
  DepositResult,
  WithdrawResult,
  RampRate,
} from "./ramp";

// Re-export shared utilities for convenience
export {
  formatUsdc,
  formatNaira,
  seasonLabel,
  statusLabel,
  formatDeadline,
  timeRemaining,
  formatTimeRemaining,
  HARVEST_LABELS,
  USDC_STROOPS_PER_UNIT,
} from "@harvestajo/shared";

