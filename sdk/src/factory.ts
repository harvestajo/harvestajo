/**
 * @harvestajo/sdk — FieldFactory contract client
 *
 * The factory deploys new Field contract instances and maintains a registry
 * of all deployed fields.  The frontend reads the registry to discover
 * available savings circles.
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  rpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import type { Signer, TxResult } from "./types";

function dummyAccount(): Account {
  return new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "0",
  );
}

export class FieldFactoryClient {
  private contract: Contract;
  private server: rpc.Server;

  constructor(
    private factoryAddress: string,
    private rpcUrl: string,
    private networkPassphrase: string,
  ) {
    this.contract = new Contract(factoryAddress);
    this.server = new rpc.Server(rpcUrl);
  }

  // -----------------------------------------------------------------
  // Setup (write — requires admin)
  // -----------------------------------------------------------------

  /** Initialize the factory with an admin address. Called once at deployment. */
  async initialize(admin: string, signer: Signer): Promise<TxResult> {
    return this.write("initialize", signer, [
      Address.fromString(admin).toScVal(),
    ]);
  }

  /** Store the WASM hash of the compiled Field contract. */
  async setFieldWasm(admin: string, wasmHash: string, signer: Signer): Promise<TxResult> {
    const hashBytes = Buffer.from(wasmHash, "hex");
    const bytesVal = xdr.ScVal.scvBytes(Buffer.from(hashBytes));
    return this.write("set_field_wasm", signer, [
      Address.fromString(admin).toScVal(),
      bytesVal,
    ]);
  }

  /** Link the Yield (reputation) contract. Every new field will report to it. */
  async setYieldContract(admin: string, yieldAddr: string, signer: Signer): Promise<TxResult> {
    return this.write("set_yield_contract", signer, [
      Address.fromString(admin).toScVal(),
      Address.fromString(yieldAddr).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Deploy (write — requires admin, returns new field address)
  // -----------------------------------------------------------------

  /**
   * Deploy a new Field contract, initialize it, and register it.
   *
   * The returned address comes from the simulation; it should match the
   * actual deployed address once the transaction confirms.
   */
  async deployField(
    admin: string,
    usdc: string,
    contributionAmount: number,
    maxMembers: number,
    cycleSeconds: number,
    signer: Signer,
  ): Promise<{ address: string; txHash: string }> {
    const args = [
      Address.fromString(admin).toScVal(),
      Address.fromString(usdc).toScVal(),
      nativeToScVal(contributionAmount, { type: "i128" }),
      nativeToScVal(maxMembers, { type: "u32" }),
      nativeToScVal(cycleSeconds, { type: "u64" }),
    ];

    // Simulate first to get the expected deployed address.
    const simResult = await this.simulate("deploy_field", args);
    const fieldAddress = scValToNative(simResult) as string;

    // Submit the transaction.
    const txResult = await this.write("deploy_field", signer, args);

    return { address: fieldAddress, txHash: txResult.hash };
  }

  // -----------------------------------------------------------------
  // Read-only queries
  // -----------------------------------------------------------------

  /** List all deployed field addresses. */
  async getFields(): Promise<string[]> {
    return this.read("get_fields");
  }

  /** Total number of fields deployed. */
  async getFieldCount(): Promise<number> {
    return this.read("get_field_count");
  }

  /** Get the linked yield contract address (if any). */
  async getYieldContract(): Promise<string | null> {
    const result = await this.read<unknown>("get_yield_contract");
    return result as string | null;
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
        `Factory.${method}() simulation failed: ${sim.error ?? "unknown"}`,
      );
    }

    const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result
      ?.retval;
    if (!retval) return undefined as T;
    return scValToNative(retval) as T;
  }

  private async simulate(method: string, args: xdr.ScVal[]): Promise<xdr.ScVal> {
    const tx = new TransactionBuilder(dummyAccount(), {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(
        `Factory.${method}() simulation failed: ${sim.error ?? "unknown"}`,
      );
    }

    return (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval;
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

