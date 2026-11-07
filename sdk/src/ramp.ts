/**
 * @harvestajo/sdk — Naira on/off-ramp integration (Aframp)
 *
 * Aframp (aframp.com) is a Stellar-native ramp built for Africa that
 * converts between Naira (NGN) and USDC on Stellar via bank transfer,
 * card, or mobile money.  Bank transfers are 0% fee via NIBSS.
 *
 * This module defines the interface for integrating with Aframp's API.
 * The actual API endpoints need to be confirmed against Aframp's
 * developer documentation — the methods below are structured to match
 * the flow shown on their website:
 *
 *   1. Enter amount & recipient (bank/mobile money details or Stellar wallet)
 *   2. Review live rate
 *   3. Send or receive USDC on Stellar
 *   4. Instant payout to bank or USDC lands in wallet
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BankDetails {
  accountNumber: string;
  bankCode: string; // NIBSS bank code
  accountName: string;
}

export interface DepositResult {
  /** The USDC amount (in stroops) delivered to the Stellar wallet. */
  usdcAmountStroops: number;
  /** The Naira amount that was deposited. */
  nairaAmount: number;
  /** The exchange rate used (NGN per USD). */
  rate: number;
  /** Reference / transaction ID from the ramp. */
  reference: string;
  /** Payment instructions (e.g. bank transfer details). */
  paymentInstructions?: string;
}

export interface WithdrawResult {
  /** The Naira amount paid to the bank account. */
  nairaAmount: number;
  /** The USDC amount (in stroops) that was converted. */
  usdcAmountStroops: number;
  /** The exchange rate used (NGN per USD). */
  rate: number;
  /** Reference / transaction ID from the ramp. */
  reference: string;
}

export interface RampRate {
  /** NGN per 1 USD. */
  ngnPerUsd: number;
  /** Fee percentage for bank transfers (0% on Aframp). */
  bankTransferFeePct: number;
  /** Fee percentage for card payments. */
  cardFeePct: number;
  /** Fee percentage for mobile money. */
  mobileMoneyFeePct: number;
  /** Timestamp of the rate. */
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// AframpClient
// ---------------------------------------------------------------------------

/**
 * Client for the Aframp Naira ↔ USDC on/off-ramp.
 *
 * NOTE: The actual API endpoints must be confirmed against Aframp's
 * developer documentation.  The methods below are structured to match
 * the flow on aframp.com but the implementation is a stub that should
 * be replaced with real API calls.
 */
export class AframpClient {
  private apiUrl: string;

  constructor(apiUrl = "https://api.aframp.com") {
    this.apiUrl = apiUrl;
  }

  /**
   * Get the current NGN/USD exchange rate and fee structure.
   * On Aframp, bank transfers via NIBSS are 0% fee.
   */
  async getRate(): Promise<RampRate> {
    // TODO: Replace with actual Aframp API call.
    // GET {apiUrl}/rate or similar
    throw new NotImplementedError(
      "AframpClient.getRate — integrate with Aframp API",
    );
  }

  /**
   * Deposit Naira and receive USDC on a Stellar wallet.
   *
   * Flow: user initiates bank transfer of `amountNgn` Naira → Aframp
   * confirms receipt → USDC is delivered to `stellarAddress` on Stellar,
   * usually within seconds.
   *
   * @param amountNgn   — Naira amount to deposit (e.g. 50000 for ₦50,000)
   * @param stellarAddress — the Stellar wallet address to receive USDC
   * @returns deposit result with USDC amount, rate, and reference
   */
  async depositNaira(
    amountNgn: number,
    stellarAddress: string,
  ): Promise<DepositResult> {
    // TODO: Replace with actual Aframp API call.
    // POST {apiUrl}/deposit with { amount, currency: "NGN", destination: stellarAddress }
    throw new NotImplementedError(
      "AframpClient.depositNaira — integrate with Aframp API",
    );
  }

  /**
   * Withdraw USDC and receive Naira in a bank account.
   *
   * Flow: user sends USDC to Aframp's Stellar address → Aframp confirms
   * on-chain → Naira is paid to the bank account via NIBSS, usually
   * within seconds.
   *
   * @param usdcAmountStroops — USDC amount in stroops (1 USDC = 10,000,000)
   * @param bankDetails      — Nigerian bank account details
   * @returns withdraw result with Naira amount, rate, and reference
   */
  async withdrawNaira(
    usdcAmountStroops: number,
    bankDetails: BankDetails,
  ): Promise<WithdrawResult> {
    // TODO: Replace with actual Aframp API call.
    // POST {apiUrl}/withdraw with { amount, currency: "USDC", bankDetails }
    throw new NotImplementedError(
      "AframpClient.withdrawNaira — integrate with Aframp API",
    );
  }
}

// ---------------------------------------------------------------------------
// YellowCard fallback
// ---------------------------------------------------------------------------

/**
 * Fallback ramp using Yellow Card — the largest licensed stablecoin
 * on/off-ramp in Africa, operating across 20 countries including Nigeria.
 * They have a Payments API and support USDC on Stellar.
 *
 * Use this if Aframp is unavailable or has liquidity issues.
 */
export class YellowCardRampClient {
  private apiUrl: string;

  constructor(apiUrl = "https://api.yellowcard.io") {
    this.apiUrl = apiUrl;
  }

  async getRate(): Promise<RampRate> {
    throw new NotImplementedError(
      "YellowCardRampClient.getRate — integrate with Yellow Card API",
    );
  }

  async depositNaira(
    amountNgn: number,
    stellarAddress: string,
  ): Promise<DepositResult> {
    throw new NotImplementedError(
      "YellowCardRampClient.depositNaira — integrate with Yellow Card API",
    );
  }

  async withdrawNaira(
    usdcAmountStroops: number,
    bankDetails: BankDetails,
  ): Promise<WithdrawResult> {
    throw new NotImplementedError(
      "YellowCardRampClient.withdrawNaira — integrate with Yellow Card API",
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

/** Convert USDC stroops to Naira at a given rate. */
export function stroopsToNaira(stroops: number, ngnPerUsd: number): number {
  const usdc = stroops / 10_000_000;
  return Math.round(usdc * ngnPerUsd);
}

/** Convert Naira to USDC stroops at a given rate. */
export function nairaToStroops(naira: number, ngnPerUsd: number): number {
  const usdc = naira / ngnPerUsd;
  return Math.round(usdc * 10_000_000);
}

