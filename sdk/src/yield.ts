/**
 * @harvestajo/sdk — Yield (reputation) contract client
 *
 * A wallet's "yield" is its on-chain reputation — the trust signal that
 * gates entry into future fields.  Each completed harvest adds to the
 * score; each default subtracts from it.
 *
 * The record methods (`recordHarvest`, `recordDefault`) are typically
 * called by field contracts (cross-contract) or by the indexer listening
 * for field events.  The SDK exposes them for manual or testing use.
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  rpc,
  TransactionBuilder,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import type { Signer, TxResult, YieldStats } from "./types.js";

function dummyAccount(): Account {
  return new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "0",
  );
}

export class YieldClient {
  private contract: Contract;
  private server: rpc.Server;

  constructor(
    private yieldAddress: string,
    private rpcUrl: string,
    private networkPassphrase: string,
  ) {
    this.contract = new Contract(yieldAddress);
    this.server = new rpc.Server(rpcUrl);
  }

  // -----------------------------------------------------------------
  // Recording (write — called by field contracts or indexer)
  // -----------------------------------------------------------------

  /** Record a successful harvest for a member. */
  async recordHarvest(
    member: string,
    fieldAddress: string,
    signer: Signer,
  ): Promise<TxResult> {
    return this.write("rcrd_h", signer, [
      Address.fromString(member).toScVal(),
      Address.fromString(fieldAddress).toScVal(),
    ]);
  }

  /** Record a default for a member. */
  async recordDefault(
    member: string,
    fieldAddress: string,
    signer: Signer,
  ): Promise<TxResult> {
    return this.write("rcrd_d", signer, [
      Address.fromString(member).toScVal(),
      Address.fromString(fieldAddress).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------

  /** Get a member's yield (reputation) score. */
  async getYield(member: string): Promise<number> {
    return this.read("get_yield", [
      Address.fromString(member).toScVal(),
    ]);
  }

  /** Get full stats: { score, completed, defaults }. */
  async getStats(member: string): Promise<YieldStats> {
    const [score, completed, defaults] = await this.read<[number, number, number]>(
      "get_stats",
      [Address.fromString(member).toScVal()],
    );
    return { score, completed, defaults };
  }

  /** Get a member's chronological event history. */
  async getHistory(member: string): Promise<string[]> {
    return this.read("get_history", [
      Address.fromString(member).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  private async read<T>(method: string, args: xdr.ScVal[] = []): Promise<T> {
    const tx = new TransactionBuilder(dummyAccount(), {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(
        `Yield.${method}() simulation failed: ${sim.error ?? "unknown"}`,
      );
    }

    const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result
      ?.retval;
    if (!retval) return undefined as T;
    return scValToNative(retval) as T;
  }

  private async write(
    method: string,
    signer: Signer,
    args: xdr.ScVal[],
  ): Promise<TxResult> {
    const account = await this.server.getAccount(signer.publicKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .build();

    const preparedTx = await this.server.prepareTransaction(tx);
    const signedXdr = await signer.signTransaction(preparedTx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);

    const result = await this.server.sendTransaction(signedTx);

    return { hash: result.hash, status: result.status } as TxResult;
  }
}

