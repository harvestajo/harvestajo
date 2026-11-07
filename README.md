# HarvestAjo

### Plant together. Harvest together.

Trustless rotating savings circles (Ajo / Esusu / ROSCA) on Stellar. Save in
dollars, contribute via Naira. The smart contract holds the pot — no
organizer can run off with your money.

---

## How it works

A **field** is a savings circle. A group of planters agree to contribute a
fixed amount of USDC each **season** (round). One planter **harvests**
(receives the pot) per season, rotating until everyone has harvested. The
contract escrows the funds and auto-pays the scheduled recipient — no
intermediary, no trust required.

```
Season 1:  all plant → Alice harvests the pot
Season 2:  all plant → Bob harvests the pot
Season 3:  all plant → Carol harvests the pot
  ...
Season N:  all plant → final planter harvests → field closes
```

Each member contributes the same amount each season and receives the pot
exactly once. Zero interest. The contract enforces it.

## The harvest vocabulary

| Term | Meaning | Traditional name |
|------|---------|-----------------|
| **Field** | A savings circle (ROSCA) | Ajo / Esusu |
| **Plant** | Contribute USDC for the season | Contribute |
| **Harvest** | Receive the pot | Collect / payout |
| **Season** | One round in the rotation | Round / cycle |
| **Yield** | On-chain reputation score | Trust score |
| **Planter** | A member of a field | Member / participant |

## Architecture

```
┌─ Soroban contracts (Rust) ────────────────────────────────┐
│                                                            │
│  field_factory   deploys + registers field instances       │
│       │                                                    │
│       ▼ deploys                                            │
│  field           core ROSCA: join, plant, harvest,         │
│                   mark_default, close (escrows USDC)       │
│       │                                                    │
│       ▼ reports to                                         │
│  yield           on-chain reputation per wallet             │
│                                                            │
└────────────────────────────────────────────────────────────┘
        ▲ events                              ▲ RPC
        │                                     │
┌───────┴──────────┐               ┌──────────┴─────────┐
│  indexer (future) │               │  @harvestajo/sdk    │
│  reads events     │               │  TypeScript client  │
└──────────────────┘               └──────────────────────┘
                                           ▲
                                           │ imports
┌──────────────────────────────────────────┴────────────────┐
│  apps/web (Next.js)                                         │
│  /             → field list (reads factory registry)       │
│  /create       → deploy a new field                         │
│  /fields/[addr]→ field detail: join, plant, harvest        │
│  /yield/[addr] → reputation dashboard                       │
└─────────────────────────────────────────────────────────────┘
        ▲
        │  Aframp / Yellow Card API
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Naira on/off-ramp                                          │
│  Bank transfer (0% fee via NIBSS) ↔ USDC on Stellar         │
└─────────────────────────────────────────────────────────────┘
```

## The Naira layer

There's no liquid Naira-pegged token on Stellar yet (NGNT has thin volume,
cNGN is nascent). So HarvestAjo settles in **USDC** — a stable, liquid
dollar token — and converts at the edges:

```
User deposits ₦50,000 (bank transfer)
  → Aframp converts to ~$33 USDC on Stellar (0% fee)
  → USDC deposited into the Field contract (escrow)
  → Each season: planters contribute USDC, contract auto-pays harvester
  → Winner withdraws USDC from contract
  → Aframp converts USDC back to Naira (instant bank payout)
```

The UI shows both USDC and Naira amounts. Users interact in Naira for
deposits and withdrawals; the contract works in USDC for escrow and
rotation. Dollar-denominated savings is a feature — the Naira has lost
significant value against the dollar, so saving in USDC protects against
devaluation.

## Default handling

If a planter doesn't contribute by the season deadline, anyone can call
`mark_default` on-chain. The defaulter:

- Gets flagged on-chain (visible to all future fields)
- Has their **yield** (reputation) score slashed
- Won't be accepted into future fields by organizers who check yield

The harvest model (fixed rotation order) means the contract can't force
a defaulter to pay — but reputation makes defaults economically irrational
(you lose access to all future savings circles).

## Project structure

```
harvestajo/
├── contracts/                  # Soroban smart contracts (Rust)
│   ├── Cargo.toml               # Workspace root
│   ├── field/                   # Core ROSCA contract
│   │   └── src/lib.rs
│   ├── field_factory/           # Deploys + registers fields
│   │   └── src/lib.rs
│   └── yield/                   # On-chain reputation
│       └── src/lib.rs
├── sdk/                         # @harvestajo/sdk (TypeScript)
│   └── src/
│       ├── client.ts            # HarvestAjoClient — main entry point
│       ├── field.ts             # FieldClient — plant, harvest, join
│       ├── factory.ts           # FieldFactoryClient — deploy fields
│       ├── yield.ts             # YieldClient — reputation queries
│       ├── ramp.ts              # Aframp/YellowCard on/off-ramp stubs
│       └── types.ts             # Config + Signer types
├── packages/
│   └── shared/                  # @harvestajo/shared — types + utils
│       └── src/index.ts
├── apps/
│   └── web/                     # Next.js frontend
│       └── src/
│           ├── app/             # Pages (App Router)
│           │   ├── page.tsx     # Field list
│           │   ├── create/      # Create a field
│           │   ├── fields/[a]/  # Field detail
│           │   └── yield/[a]/   # Reputation page
│           ├── components/      # UI components
│           └── lib/             # Config + wallet integration
├── package.json                 # Turborepo workspace root
└── README.md
```

## Prerequisites

- [Rust](https://rustup.rs/) (stable, with `wasm32-unknown-unknown` target)
- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) 10+
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli) (for deploying contracts)
- [Freighter](https://www.freighter.app/) wallet browser extension (for the web app)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Build the contracts

```bash
# Add the WASM target if not already installed
rustup target add wasm32-unknown-unknown

# Build all contracts
npm run build:contracts
```

### 3. Deploy contracts (Stellar Testnet)

```bash
# Deploy the Yield contract
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/harvestajo_yield.wasm --network testnet

# Deploy the Field contract
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/harvestajo_field.wasm --network testnet

# Deploy the FieldFactory contract
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/harvestajo_field_factory.wasm --network testnet

# Upload the Field WASM hash to the factory (for deploying instances)
stellar contract upload --wasm target/wasm32-unknown-unknown/release/harvestajo_field.wasm --network testnet
```

### 4. Configure the web app

All contracts are live on Stellar Testnet:

| Contract | Address |
|---|---|
| USDC (SAC) | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| Yield (reputation) | `CDMXHO2HX35VVUUPQ4NQCIRM6IYSMF26OA622A47HNMJV2RHVZB3CMDI` |
| FieldFactory | `CA7YR4Z47R4C4RUG5BOYJWCXGFKMTPH5MORAWNECVE3CJS6WQFIMISCX` |
| Field template WASM | `692c53c8b2ed0d12b67e8a8ab4af9821babe1e4921fe08c85d68812e6ccc666e` |

These addresses are already configured in `apps/web/src/lib/config.ts`. No changes needed to run on testnet.

### 5. Run the web app

```bash
npm run dev
```

Open http://localhost:3000

## Contract reference

### Field contract

| Function | Type | Description |
|----------|------|-------------|
| `initialize` | write | Set up the field (admin, USDC, contribution, members, cycle) |
| `join` | write | A member joins the field |
| `set_harvest_order` | write | Organizer sets who harvests in which season |
| `activate` | write | Start the first season |
| `plant` | write | Contribute USDC for the current season |
| `mark_default` | write | Flag a member who hasn't planted by deadline |
| `set_yield_contract` | write | Link the Yield (reputation) contract |
| `get_status` | read | Current field status (Open/Active/Closed) |
| `get_members` | read | List all members |
| `get_contribution_amount` | read | USDC amount per season |
| `get_current_season` | read | Current season number |
| `get_planted_members` | read | Who has planted this season |
| `get_defaults` | read | List of defaulted member indices |
| `get_info` (SDK) | read | All field details in one call |

### FieldFactory contract

| Function | Type | Description |
|----------|------|-------------|
| `initialize` | write | Set the factory admin |
| `set_field_wasm` | write | Store the Field WASM hash |
| `set_yield_contract` | write | Link the Yield contract |
| `deploy_field` | write | Deploy + initialize a new field |
| `get_fields` | read | List all deployed field addresses |
| `get_field_count` | read | Total fields deployed |

### Yield contract

| Function | Type | Description |
|----------|------|-------------|
| `rcrd_h` | write | Record a harvest (called by field contract) |
| `rcrd_d` | write | Record a default (called by field contract) |
| `get_yield` | read | Get a wallet's reputation score |
| `get_stats` | read | Get score + completed + defaults |
| `get_history` | read | Get chronological event log |

## SDK usage

```typescript
import { HarvestAjoClient } from "@harvestajo/sdk";

// Create a client
const client = HarvestAjoClient.testnet(usdc, factory, yield);

// Deploy a new field
const { address } = await client.factory!.deployField(
  organizerAddress,
  usdcContract,
  33_0000000,  // $33 USDC (in stroops)
  10,          // 10 members = 10 seasons
  2_592_000,   // 30 days per season (in seconds)
  signer,
);

// Join the field
const field = client.fieldAt(address);
await field.join(myAddress, signer);

// Plant (contribute) — approve USDC first, then plant
await field.approveUsdc(myAddress, signer);
await field.plant(myAddress, signer);

// Check reputation
const stats = await client.yield!.getStats(myAddress);
console.log(stats); // { score: 10, completed: 1, defaults: 0 }
```

## Tech stack

- **Blockchain:** Stellar (Soroban smart contracts)
- **Contracts:** Rust, compiled to WASM
- **Settlement:** USDC on Stellar
- **Naira ramp:** Aframp (primary), Yellow Card (fallback)
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Wallet:** Freighter
- **SDK:** TypeScript, @stellar/stellar-sdk
- **Monorepo:** Turborepo + npm workspaces

## Contributing

HarvestAjo is open-source (MIT). Contributions welcome.

1. Fork the repo
2. Create a feature branch
3. Build contracts: `npm run build:contracts`
4. Run tests: `npm run test:contracts`
5. Submit a pull request

## License

MIT
