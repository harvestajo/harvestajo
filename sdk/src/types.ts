/**
 * @harvestajo/sdk — types and configuration
 *
 * The Signer interface is designed to be compatible with Freighter and
 * other Stellar wallet extensions.  Any wallet that can sign a transaction
 * XDR string can be wrapped as a Signer.
 */

/** Configuration for the HarvestAjo SDK. */
export interface HarvestAjoConfig {
  /** Soroban RPC URL (e.g. https://soroban-testnet.stellar.org for testnet) */
  rpcUrl: string;
  /** Stellar network passphrase */
  networkPassphrase: string;
  /** USDC token contract address on this network */
  usdcContract: string;
  /** FieldFactory contract address (optional — set after deploying) */
  factoryContract?: string;
  /** Yield (reputation) contract address (optional — set after deploying) */
  yieldContract?: string;
}

/**
 * A wallet signer.  Compatible with Freighter's `signTransaction` API:
 * accepts an unsigned transaction XDR string, returns a signed XDR string.
 */
export interface Signer {
  publicKey: string;
  signTransaction: (txXdr: string) => Promise<string>;
}

/** Field lifecycle status, matching the on-chain enum. */
export type FieldStatus = "Open" | "Active" | "Closed";

/** Full details about a field, pulled from on-chain storage. */
export interface FieldInfo {
  address: string;
  admin: string;
  usdc: string;
  contributionAmount: number;
  maxMembers: number;
  currentSeason: number;
  status: FieldStatus;
  cycleSeconds: number;
  seasonStart: number;
  members: string[];
  harvestOrder: number[];
  defaults: number[];
}

/** Reputation stats for a wallet. */
export interface YieldStats {
  score: number;
  completed: number;
  defaults: number;
}

/** Result of a successful write transaction. */
export interface TxResult {
  hash: string;
  status: "SUCCESS" | "PENDING" | "ERROR";
}

