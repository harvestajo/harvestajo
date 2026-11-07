#![no_std]
//! # HarvestAjo FieldFactory Contract
//!
//! Deploys and registers Field contract instances. Stores the Field WASM
//! hash so it can deploy fresh instances on demand. Every deployed field
//! is registered in a list the frontend reads to discover savings circles.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, BytesN, Env, IntoVal, Symbol, Val, Vec, vec,
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum FactoryKey {
    Admin,
    Fields,
    FieldCount,
    FieldWasmHash,
    YieldContract,
}

const LEDGERS_PER_YEAR: u32 = 6_307_200;
const TTL_BUMP: u32 = LEDGERS_PER_YEAR * 2;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct FieldFactory;

#[contractimpl]
impl FieldFactory {
    /// Initialize the factory.
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        let s = env.storage().persistent();
        s.set(&FactoryKey::Admin, &admin);
        s.set(&FactoryKey::Fields, &Vec::<Address>::new(&env));
        s.set(&FactoryKey::FieldCount, &0u32);
    }

    /// Store the WASM hash of the compiled Field contract. Admin only.
    pub fn set_field_wasm(env: Env, admin: Address, wasm_hash: BytesN<32>) {
        admin.require_auth();
        require_admin(&env, &admin);
        env.storage().persistent().set(&FactoryKey::FieldWasmHash, &wasm_hash);
        env.storage().persistent().extend_ttl(&FactoryKey::FieldWasmHash, TTL_BUMP, TTL_BUMP);
    }

    /// Link the Yield (reputation) contract. Admin only.
    pub fn set_yield_contract(env: Env, admin: Address, yield_addr: Address) {
        admin.require_auth();
        require_admin(&env, &admin);
        env.storage().persistent().set(&FactoryKey::YieldContract, &yield_addr);
        env.storage().persistent().extend_ttl(&FactoryKey::YieldContract, TTL_BUMP, TTL_BUMP);
    }

    /// Deploy a new Field contract, initialize it, and register it.
    /// Returns the new field's contract address.
    pub fn deploy_field(
        env: Env,
        admin: Address,
        usdc: Address,
        contribution: i128,
        max_members: u32,
        cycle_secs: u64,
    ) -> Address {
        admin.require_auth();
        require_admin(&env, &admin);

        let wasm_hash: BytesN<32> = env
            .storage()
            .persistent()
            .get(&FactoryKey::FieldWasmHash)
            .unwrap_or_else(|| panic!("field wasm hash not set"));

        // Unique salt from the field counter
        let count: u32 = env
            .storage()
            .persistent()
            .get(&FactoryKey::FieldCount)
            .unwrap_or(0);

        let mut salt_bytes = [0u8; 32];
        let cb = count.to_be_bytes();
        salt_bytes[28] = cb[0];
        salt_bytes[29] = cb[1];
        salt_bytes[30] = cb[2];
        salt_bytes[31] = cb[3];
        let salt = BytesN::<32>::from_array(&env, &salt_bytes);

        // Deploy
        let field_addr = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, ());

        // Initialize the field
        let init_args: Vec<Val> = vec![
            &env,
            admin.to_val(),
            usdc.to_val(),
            contribution.into_val(&env),
            max_members.into_val(&env),
            cycle_secs.into_val(&env),
        ];
        env.invoke_contract::<()>(
            &field_addr,
            &Symbol::new(&env, "initialize"),
            init_args,
        );

        // Link yield contract if set
        if let Some(yield_addr) = env
            .storage()
            .persistent()
            .get::<FactoryKey, Address>(&FactoryKey::YieldContract)
        {
            let yield_args: Vec<Val> = vec![
                &env,
                admin.to_val(),
                yield_addr.to_val(),
            ];
            env.invoke_contract::<()>(
                &field_addr,
                &Symbol::new(&env, "set_yield_contract"),
                yield_args,
            );
        }

        // Register the field
        let mut fields: Vec<Address> = env
            .storage()
            .persistent()
            .get(&FactoryKey::Fields)
            .unwrap_or_else(|| Vec::new(&env));
        fields.push_back(field_addr.clone());
        env.storage().persistent().set(&FactoryKey::Fields, &fields);
        env.storage().persistent().extend_ttl(&FactoryKey::Fields, TTL_BUMP, TTL_BUMP);
        env.storage().persistent().set(&FactoryKey::FieldCount, &(count + 1));
        env.storage().persistent().extend_ttl(&FactoryKey::FieldCount, TTL_BUMP, TTL_BUMP);

        env.events().publish(
            (symbol_short!("factory"), symbol_short!("deploy")),
            (admin, field_addr.clone()),
        );

        field_addr
    }

    // -----------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------

    pub fn get_fields(env: Env) -> Vec<Address> {
        env.storage()
            .persistent()
            .get(&FactoryKey::Fields)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_field_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&FactoryKey::FieldCount)
            .unwrap_or(0)
    }

    pub fn get_yield_contract(env: Env) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&FactoryKey::YieldContract)
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) {
    let admin: Address = env
        .storage()
        .persistent()
        .get(&FactoryKey::Admin)
        .unwrap();
    if caller != &admin {
        panic!("not admin")
    }
}
