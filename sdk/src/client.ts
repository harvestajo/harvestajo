/**
 * @harvestajo/sdk — main client
 *
 * The entry point for interacting with the HarvestAjo protocol.
 * Create one HarvestAjoClient, then use `.fieldAt()` to get a FieldClient
 * for any deployed field, `.factory` to deploy new fields, and `.yield` to
 * check reputation.
 *
 * @example
 * ```ts
 * const client = new HarvestAjoClient({
 *   rpcUrl: "https://soroban-testnet.stellar.org",
 *   networkPassphrase: TESTNET_PASSPHRASE,
 *   usdcContract: "CC...",
 *   factoryContract: "CA...",
 *   yieldContract: "CA...",
 * });
 *
 * // Join a field
 * const field = client.fieldAt("CA...fieldaddress...");
 * await field.join(myAddress, signer);
 *
 * // Plant (contribute) — approve USDC first, then plant
 * await field.approveUsdc(myAddress, signer);
 * await field.plant(myAddress, signer);
 *
 * // Check reputation
 * const stats = await client.yield?.getStats(myAddress);
 * ```
 */

import { FieldClient } from "./field";
import { FieldFactoryClient } from "./factory";
import { YieldClient } from "./yield";
import type { HarvestAjoConfig } from "./types";

export class HarvestAjoClient {
  /** FieldFactory client (if factoryContract is configured). */
  readonly factory: FieldFactoryClient | null;

  /** Yield (reputation) client (if yieldContract is configured). */
  readonly yield: YieldClient | null;

  /** The configured USDC contract address. */
  readonly usdcContract: string;

  /** The configured network passphrase. */
  readonly networkPassphrase: string;

  /** The configured RPC URL. */
  readonly rpcUrl: string;

  constructor(config: HarvestAjoConfig) {
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase;
    this.usdcContract = config.usdcContract;

    this.factory = config.factoryContract
      ? new FieldFactoryClient(
          config.factoryContract,
          config.rpcUrl,
          config.networkPassphrase,
        )
      : null;

    this.yield = config.yieldContract
      ? new YieldClient(
          config.yieldContract,
          config.rpcUrl,
          config.networkPassphrase,
        )
      : null;
  }

  /**
   * Get a FieldClient for a specific deployed field.
   * Use this to interact with any field discovered via the factory registry.
   */
  fieldAt(fieldAddress: string): FieldClient {
    return new FieldClient(
      fieldAddress,
      this.rpcUrl,
      this.networkPassphrase,
    );
  }

  /** Testnet default configuration. */
  static testnet(usdcContract: string, factoryContract?: string, yieldContract?: string): HarvestAjoClient {
    return new HarvestAjoClient({
      rpcUrl: "https://soroban-testnet.stellar.org:443",
      networkPassphrase: "Test SDF Network ; September 2015",
      usdcContract,
      factoryContract,
      yieldContract,
    });
  }

  /** Mainnet default configuration. */
  static mainnet(usdcContract: string, factoryContract?: string, yieldContract?: string): HarvestAjoClient {
    return new HarvestAjoClient({
      rpcUrl: "https://soroban-mainnet.stellar.org:443",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
      usdcContract,
      factoryContract,
      yieldContract,
    });
  }
}

