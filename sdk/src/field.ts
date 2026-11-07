/**
 * @harvestajo/sdk — Field contract client
 *
 * A "field" is a savings circle.  Members **plant** (contribute USDC) each
 * season, and one member **harvests** (receives the pot) per season, rotating
 * until everyone has harvested.  This client wraps the on-chain Field
 * contract with a clean, harvest-themed API.
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
import type { FieldInfo, FieldStatus, Signer, TxResult } from "./types";

/** Creates a dummy account for read-only simulations. */
function dummyAccount(): Account {
  return new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "0",
  );
}

/** Build the arguments for a contract call as an array of ScVals. */
function buildArgs(...vals: xdr.ScVal[]): xdr.ScVal[] {
  return vals;
}

/**
 * Client for a single deployed Field contract.
 *
 * Read methods simulate the transaction and return the parsed result.
 * Write methods build, prepare, sign (via the provided Signer), and submit
 * the transaction to the network.
 */
export class FieldClient {
  private contract: Contract;
  private server: rpc.Server;

  constructor(
    private fieldAddress: string,
    private rpcUrl: string,
    private networkPassphrase: string,
  ) {
    this.contract = new Contract(fieldAddress);
    this.server = new rpc.Server(rpcUrl);
  }

  // -----------------------------------------------------------------
  // Setup (write — requires organizer)
  // -----------------------------------------------------------------

  /** Initialize the field. Called once at deployment. */
  async initialize(
    admin: string,
    usdc: string,
    contributionAmount: number,
    maxMembers: number,
    cycleSeconds: number,
    signer: Signer,
  ): Promise<TxResult> {
    return this.write("initialize", signer, [
      Address.fromString(admin).toScVal(),
      Address.fromString(usdc).toScVal(),
      nativeToScVal(contributionAmount, { type: "i128" }),
      nativeToScVal(maxMembers, { type: "u32" }),
      nativeToScVal(cycleSeconds, { type: "u64" }),
    ]);
  }

  /** Link this field to a Yield (reputation) contract. */
  async setYieldContract(admin: string, yieldAddr: string, signer: Signer): Promise<TxResult> {
    return this.write("set_yield_contract", signer, [
      Address.fromString(admin).toScVal(),
      Address.fromString(yieldAddr).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Joining (write — requires member)
  // -----------------------------------------------------------------

  /** A member joins the field. Only works while the field is Open. */
  async join(member: string, signer: Signer): Promise<TxResult> {
    return this.write("join", signer, [
      Address.fromString(member).toScVal(),
    ]);
  }

  /** Organizer sets the harvest order — which member harvests in which season. */
  async setHarvestOrder(admin: string, order: number[], signer: Signer): Promise<TxResult> {
    const orderScVal = nativeToScVal(
      order.map((n) => nativeToScVal(n, { type: "u32" })),
    );
    return this.write("set_harvest_order", signer, [
      Address.fromString(admin).toScVal(),
      orderScVal,
    ]);
  }

  /** Organizer activates the field — the first season begins. */
  async activate(admin: string, signer: Signer): Promise<TxResult> {
    return this.write("activate", signer, [
      Address.fromString(admin).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Planting (write — requires member)
  // -----------------------------------------------------------------

  /**
   * A member plants — contributes their USDC for the current season.
   *
   * The member must have approved the field contract to spend their USDC
   * beforehand (call `approveUsdc` first).  When the last member plants,
   * the pot auto-harvests to the scheduled recipient.
   */
  async plant(member: string, signer: Signer): Promise<TxResult> {
    return this.write("plant", signer, [
      Address.fromString(member).toScVal(),
    ]);
  }

  /**
   * Approve the field contract to spend the contribution amount of USDC.
   * Call this before `plant`.  This is a separate transaction that calls
   * the USDC token contract's `approve` function.
   */
  async approveUsdc(member: string, signer: Signer): Promise<TxResult> {
    const usdcAddr = await this.getUsdc();
    const contribution = await this.getContributionAmount();
    return this.writeOn(usdcAddr, "approve", signer, [
      Address.fromString(this.fieldAddress).toScVal(),
      nativeToScVal(contribution, { type: "i128" }),
      nativeToScVal(0, { type: "u32" }), // expiration ledger (0 = no expiry)
    ]);
  }

  // -----------------------------------------------------------------
  // Default handling (write — callable by anyone)
  // -----------------------------------------------------------------

  /**
   * Mark a member as defaulted for the current season.
   * Only works after the cycle deadline has passed and the member hasn't planted.
   */
  async markDefault(member: string, signer: Signer): Promise<TxResult> {
    return this.write("mark_default", signer, [
      Address.fromString(member).toScVal(),
    ]);
  }

  // -----------------------------------------------------------------
  // Read-only queries (no signer needed)
  // -----------------------------------------------------------------

  async getStatus(): Promise<FieldStatus> {
    return this.read("get_status");
  }

  async getAdmin(): Promise<string> {
    return this.read("get_admin");
  }

  async getUsdc(): Promise<string> {
    return this.read("get_usdc");
  }

  async getContributionAmount(): Promise<number> {
    return this.read("get_contribution_amount");
  }

  async getMaxMembers(): Promise<number> {
    return this.read("get_max_members");
  }

  async getCurrentSeason(): Promise<number> {
    return this.read("get_current_season");
  }

  async getMembers(): Promise<string[]> {
    return this.read("get_members");
  }

  async getHarvestOrder(): Promise<number[]> {
    return this.read("get_harvest_order");
  }

  async getSeasonStart(): Promise<number> {
    return this.read("get_season_start");
  }

  async getCycleSeconds(): Promise<number> {
    return this.read("get_cycle_seconds");
  }

  async getPlantedMembers(): Promise<string[]> {
    return this.read("get_planted_members");
  }

  async getDefaults(): Promise<number[]> {
    return this.read("get_defaults");
  }

  /** Fetch all field details in one call and return a FieldInfo object. */
  async getInfo(): Promise<FieldInfo> {
    const [
      admin,
      usdc,
      contributionAmount,
      maxMembers,
      currentSeason,
      status,
      cycleSeconds,
      seasonStart,
      members,
      harvestOrder,
      defaults,
    ] = await Promise.all([
      this.getAdmin(),
      this.getUsdc(),
      this.getContributionAmount(),
      this.getMaxMembers(),
      this.getCurrentSeason(),
      this.getStatus(),
      this.getCycleSeconds(),
      this.getSeasonStart(),
      this.getMembers(),
      this.getHarvestOrder(),
      this.getDefaults(),
    ]);

    return {
      address: this.fieldAddress,
      admin,
      usdc,
      contributionAmount,
      maxMembers,
      currentSeason,
      status,
      cycleSeconds,
      seasonStart,
      members,
      harvestOrder,
      defaults,
    };
  }

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  /** Simulate a read-only contract call and return the parsed result. */
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
        `Field.${method}() simulation failed: ${sim.error ?? "unknown"}`,
      );
    }

    const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result
      ?.retval;
    if (!retval) return undefined as T;
    return scValToNative(retval) as T;
  }

  /** Build, prepare, sign, and submit a write transaction. */
  private async write(
    method: string,
    signer: Signer,
    args: xdr.ScVal[],
  ): Promise<TxResult> {
    return this.writeOn(this.fieldAddress, method, signer, args);
  }

  /** Write to an arbitrary contract (used for USDC approve calls). */
  private async writeOn(
    contractAddress: string,
    method: string,
    signer: Signer,
    args: xdr.ScVal[],
  ): Promise<TxResult> {
    const contract = new Contract(contractAddress);
    const account = await this.server.getAccount(signer.publicKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .build();

    // Prepare adds Soroban resource footprint + auth entries.
    const preparedTx = await this.server.prepareTransaction(tx);

    // Sign with the wallet (Freighter-compatible XDR string API).
    const signedXdr = await signer.signTransaction(preparedTx.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);

    const result = await this.server.sendTransaction(signedTx);

    return {
      hash: result.hash,
      status: result.status,
    } as TxResult;
  }
}

