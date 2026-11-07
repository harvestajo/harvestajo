/**
 * Network configuration for HarvestAjo.
 *
 * Update these values after deploying the contracts to testnet or mainnet.
 * The USDC, factory, and yield contract addresses are set during deployment.
 */

export const NETWORK = {
  rpcUrl: "https://soroban-testnet.stellar.org:443",
  networkPassphrase: "Test SDF Network ; September 2015",
  /** USDC SAC on Stellar testnet (Circle-issued USDC). */
  usdcContract: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  /** HarvestAjo FieldFactory — deployed 2026-11-08. */
  factoryContract: "CA7YR4Z47R4C4RUG5BOYJWCXGFKMTPH5MORAWNECVE3CJS6WQFIMISCX",
  /** HarvestAjo Yield (reputation) — deployed 2026-11-08. */
  yieldContract: "CDMXHO2HX35VVUUPQ4NQCIRM6IYSMF26OA622A47HNMJV2RHVZB3CMDI",
  /** Field template WASM hash (used by factory to deploy new circles). */
  fieldWasmHash: "692c53c8b2ed0d12b67e8a8ab4af9821babe1e4921fe08c85d68812e6ccc666e",
} as const;

/** Default NGN per USD rate for display purposes. Replace with Aframp live rate. */
export const DEFAULT_NGN_PER_USD = 1500;

/** Human-readable network name. */
export const NETWORK_NAME = "Stellar Testnet";
