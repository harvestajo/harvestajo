#![no_std]
//! # HarvestAjo Yield Contract
//!
//! On-chain reputation per wallet. Completed harvests add to the score;
//! defaults subtract. A wallet's yield is the trust signal that gates
//! entry into future fields.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum YieldKey {
    Score(Address),
    Completed(Address),
    Defaults(Address),
    History(Address),
}

const HARVEST_BONUS: u32 = 10;
const DEFAULT_PENALTY: u32 = 20;

const LEDGERS_PER_YEAR: u32 = 6_307_200; // ~5s per ledger
const TTL_BUMP: u32 = LEDGERS_PER_YEAR * 2; // 2-year bump on every access

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct Yield;

#[contractimpl]
impl Yield {
    /// Record a successful harvest for `member` in `field_addr`.
    pub fn rcrd_h(env: Env, member: Address, _field_addr: Address) {
        let key = YieldKey::Score(member.clone());
        let score: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(score + HARVEST_BONUS));
        env.storage().persistent().extend_ttl(&key, TTL_BUMP, TTL_BUMP);

        let ck = YieldKey::Completed(member.clone());
        let completed: u32 = env.storage().persistent().get(&ck).unwrap_or(0);
        env.storage().persistent().set(&ck, &(completed + 1));
        env.storage().persistent().extend_ttl(&ck, TTL_BUMP, TTL_BUMP);

        let hk = YieldKey::History(member.clone());
        let mut hist: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&hk)
            .unwrap_or_else(|| Vec::new(&env));
        hist.push_back(symbol_short!("harvest"));
        env.storage().persistent().set(&hk, &hist);
        env.storage().persistent().extend_ttl(&hk, TTL_BUMP, TTL_BUMP);

        env.events().publish(
            (symbol_short!("yield"), symbol_short!("harvest")),
            member,
        );
    }

    /// Record a default for `member` in `field_addr`.
    pub fn rcrd_d(env: Env, member: Address, _field_addr: Address) {
        let key = YieldKey::Score(member.clone());
        let score: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&key, &score.saturating_sub(DEFAULT_PENALTY));
        env.storage().persistent().extend_ttl(&key, TTL_BUMP, TTL_BUMP);

        let dk = YieldKey::Defaults(member.clone());
        let defaults: u32 = env.storage().persistent().get(&dk).unwrap_or(0);
        env.storage().persistent().set(&dk, &(defaults + 1));
        env.storage().persistent().extend_ttl(&dk, TTL_BUMP, TTL_BUMP);

        let hk = YieldKey::History(member.clone());
        let mut hist: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&hk)
            .unwrap_or_else(|| Vec::new(&env));
        hist.push_back(symbol_short!("default"));
        env.storage().persistent().set(&hk, &hist);
        env.storage().persistent().extend_ttl(&hk, TTL_BUMP, TTL_BUMP);

        env.events().publish(
            (symbol_short!("yield"), symbol_short!("default")),
            member,
        );
    }

    /// Get a member's yield (reputation) score.
    pub fn get_yield(env: Env, member: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&YieldKey::Score(member))
            .unwrap_or(0)
    }

    /// Get full stats: (score, completed, defaults).
    pub fn get_stats(env: Env, member: Address) -> (u32, u32, u32) {
        let score: u32 = env
            .storage()
            .persistent()
            .get(&YieldKey::Score(member.clone()))
            .unwrap_or(0);
        let completed: u32 = env
            .storage()
            .persistent()
            .get(&YieldKey::Completed(member.clone()))
            .unwrap_or(0);
        let defaults: u32 = env
            .storage()
            .persistent()
            .get(&YieldKey::Defaults(member))
            .unwrap_or(0);
        (score, completed, defaults)
    }

    /// Get a member's chronological event history.
    pub fn get_history(env: Env, member: Address) -> Vec<Symbol> {
        env.storage()
            .persistent()
            .get(&YieldKey::History(member))
            .unwrap_or_else(|| Vec::new(&env))
    }
}
