#![no_std]
//! # HarvestAjo Field Contract
//!
//! The core ROSCA. Members **plant** (contribute USDC) each season and one
//! member **harvests** (receives the pot) per season, rotating until every
//! member has harvested once.
//!
//! ## Lifecycle
//! 1. `initialize`      — organizer deploys the field
//! 2. `join`            — members join until full
//! 3. `set_harvest_order` — organizer sets rotation order
//! 4. `activate`        — first season begins
//! 5. `plant`           — members contribute USDC each season; last one
//!                        triggers auto-harvest
//! 6. `mark_default`    — flag a member who missed the deadline

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token::Client as TokenClient,
    Address, Env, Vec,
};

// ---------------------------------------------------------------------------
// Storage keys  — all persistent (funds + member data must survive archival)
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Usdc,
    ContributionAmount,
    MaxMembers,
    CurrentSeason,
    Status,
    CycleSeconds,
    SeasonStart,
    Members,
    HarvestOrder,
    Planted,        // Vec<Address> — who planted this season
    Harvested,      // Vec<u32>     — member indices who have harvested
    MemberIndex,    // Vec<Address> — same as Members, used for O(1) lookup via find
    Defaults,       // Vec<u32>     — defaulted member indices
    YieldContract,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum FieldStatus {
    Open   = 0,
    Active = 1,
    Closed = 2,
}

const LEDGERS_PER_YEAR: u32 = 6_307_200;
const TTL_BUMP: u32 = LEDGERS_PER_YEAR * 2;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct Field;

#[contractimpl]
impl Field {
    // -----------------------------------------------------------------
    // Initialize
    // -----------------------------------------------------------------

    pub fn initialize(
        env: Env,
        admin: Address,
        usdc: Address,
        contribution: i128,
        max_members: u32,
        cycle_secs: u64,
    ) {
        admin.require_auth();
        if contribution <= 0 { panic!("contribution must be positive") }
        if max_members < 2   { panic!("need at least 2 members") }
        if cycle_secs == 0   { panic!("cycle must be positive") }

        let s = env.storage().persistent();
        s.set(&DataKey::Admin, &admin);
        s.set(&DataKey::Usdc, &usdc);
        s.set(&DataKey::ContributionAmount, &contribution);
        s.set(&DataKey::MaxMembers, &max_members);
        s.set(&DataKey::CycleSeconds, &cycle_secs);
        s.set(&DataKey::CurrentSeason, &0u32);
        s.set(&DataKey::Status, &FieldStatus::Open);
        s.set(&DataKey::SeasonStart, &0u64);
        s.set(&DataKey::Members, &Vec::<Address>::new(&env));
        s.set(&DataKey::HarvestOrder, &Vec::<u32>::new(&env));
        s.set(&DataKey::Planted, &Vec::<Address>::new(&env));
        s.set(&DataKey::Harvested, &Vec::<u32>::new(&env));
        s.set(&DataKey::Defaults, &Vec::<u32>::new(&env));

        env.events()
            .publish((symbol_short!("field"), symbol_short!("init")), admin);
    }

    // -----------------------------------------------------------------
    // Joining
    // -----------------------------------------------------------------

    pub fn join(env: Env, member: Address) {
        member.require_auth();

        let status: FieldStatus = pget(&env, DataKey::Status);
        if status != FieldStatus::Open { panic!("field not open") }

        let max: u32 = pget(&env, DataKey::MaxMembers);
        let mut members: Vec<Address> = pget(&env, DataKey::Members);

        if members.len() >= max { panic!("field is full") }

        // Duplicate check
        for i in 0..members.len() {
            if members.get_unchecked(i) == member { panic!("already joined") }
        }

        members.push_back(member.clone());
        env.storage().persistent().set(&DataKey::Members, &members);
        env.storage().persistent().extend_ttl(&DataKey::Members, TTL_BUMP, TTL_BUMP);

        env.events()
            .publish((symbol_short!("field"), symbol_short!("join")), member);
    }

    /// Organizer sets harvest order — member index for each season.
    pub fn set_harvest_order(env: Env, admin: Address, order: Vec<u32>) {
        admin.require_auth();
        require_admin(&env, &admin);

        let status: FieldStatus = pget(&env, DataKey::Status);
        if status != FieldStatus::Open { panic!("can only set order while open") }

        let max: u32 = pget(&env, DataKey::MaxMembers);
        if order.len() != max { panic!("order length must equal member count") }

        // Validate uniqueness and range
        for i in 0..order.len() {
            let idx = order.get_unchecked(i);
            if idx >= max { panic!("index out of range") }
            for j in (i + 1)..order.len() {
                if order.get_unchecked(j) == idx { panic!("duplicate index") }
            }
        }

        env.storage().persistent().set(&DataKey::HarvestOrder, &order);
        env.storage().persistent().extend_ttl(&DataKey::HarvestOrder, TTL_BUMP, TTL_BUMP);
    }

    /// Link this field to a Yield (reputation) contract.
    pub fn set_yield_contract(env: Env, admin: Address, yield_addr: Address) {
        admin.require_auth();
        require_admin(&env, &admin);
        env.storage().persistent().set(&DataKey::YieldContract, &yield_addr);
        env.storage().persistent().extend_ttl(&DataKey::YieldContract, TTL_BUMP, TTL_BUMP);
    }

    // -----------------------------------------------------------------
    // Activation
    // -----------------------------------------------------------------

    pub fn activate(env: Env, admin: Address) {
        admin.require_auth();
        require_admin(&env, &admin);

        let status: FieldStatus = pget(&env, DataKey::Status);
        if status != FieldStatus::Open { panic!("field not open") }

        let members: Vec<Address> = pget(&env, DataKey::Members);
        let max: u32 = pget(&env, DataKey::MaxMembers);
        if members.len() != max { panic!("field not full") }

        let order: Vec<u32> = pget(&env, DataKey::HarvestOrder);
        if order.len() != max { panic!("harvest order not set") }

        let now = env.ledger().timestamp();
        let s = env.storage().persistent();
        s.set(&DataKey::Status, &FieldStatus::Active);
        s.set(&DataKey::SeasonStart, &now);
        s.set(&DataKey::Planted, &Vec::<Address>::new(&env));
        s.extend_ttl(&DataKey::Status, TTL_BUMP, TTL_BUMP);
        s.extend_ttl(&DataKey::SeasonStart, TTL_BUMP, TTL_BUMP);

        env.events()
            .publish((symbol_short!("field"), symbol_short!("active")), now);
    }

    // -----------------------------------------------------------------
    // Plant (contribute)
    // -----------------------------------------------------------------

    pub fn plant(env: Env, member: Address) {
        member.require_auth();

        let status: FieldStatus = pget(&env, DataKey::Status);
        if status != FieldStatus::Active { panic!("field not active") }

        // Membership check
        let members: Vec<Address> = pget(&env, DataKey::Members);
        let mut is_member = false;
        for i in 0..members.len() {
            if members.get_unchecked(i) == member {
                is_member = true;
                break;
            }
        }
        if !is_member { panic!("not a member") }

        // Duplicate plant check
        let mut planted: Vec<Address> = pget(&env, DataKey::Planted);
        for i in 0..planted.len() {
            if planted.get_unchecked(i) == member { panic!("already planted") }
        }

        // Pull USDC from member into contract
        let contribution: i128 = pget(&env, DataKey::ContributionAmount);
        let usdc: Address = pget(&env, DataKey::Usdc);
        let contract_addr = env.current_contract_address();
        TokenClient::new(&env, &usdc).transfer(&member, &contract_addr, &contribution);

        planted.push_back(member.clone());
        env.storage().persistent().set(&DataKey::Planted, &planted);
        env.storage().persistent().extend_ttl(&DataKey::Planted, TTL_BUMP, TTL_BUMP);

        env.events()
            .publish((symbol_short!("field"), symbol_short!("plant")), (member, contribution));

        // Auto-harvest when all members have planted
        let max: u32 = pget(&env, DataKey::MaxMembers);
        if planted.len() == max {
            Self::do_harvest(&env);
        }
    }

    // -----------------------------------------------------------------
    // Harvest (internal)
    // -----------------------------------------------------------------

    fn do_harvest(env: &Env) {
        let season: u32 = pget(env, DataKey::CurrentSeason);
        let order: Vec<u32>    = pget(env, DataKey::HarvestOrder);
        let members: Vec<Address> = pget(env, DataKey::Members);
        let max: u32           = pget(env, DataKey::MaxMembers);

        let harvester_idx = order.get_unchecked(season);
        let harvester = members.get_unchecked(harvester_idx);

        // Pot = contribution × number of planted members this season
        let contribution: i128 = pget(env, DataKey::ContributionAmount);
        let planted: Vec<Address> = pget(env, DataKey::Planted);
        let pot = contribution * (planted.len() as i128);

        // Transfer pot to harvester
        if pot > 0 {
            let usdc: Address = pget(env, DataKey::Usdc);
            let contract_addr = env.current_contract_address();
            TokenClient::new(env, &usdc).transfer(&contract_addr, &harvester, &pot);
        }

        // Record harvested index
        let mut harvested: Vec<u32> = pget(env, DataKey::Harvested);
        harvested.push_back(harvester_idx);
        env.storage().persistent().set(&DataKey::Harvested, &harvested);
        env.storage().persistent().extend_ttl(&DataKey::Harvested, TTL_BUMP, TTL_BUMP);

        // Notify yield contract if linked
        if let Some(yield_addr) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::YieldContract)
        {
            let args = soroban_sdk::vec![
                env,
                harvester.to_val(),
                env.current_contract_address().to_val(),
            ];
            let _ = env.try_invoke_contract::<(), soroban_sdk::Error>(
                &yield_addr,
                &symbol_short!("rcrd_h"),
                args,
            );
        }

        env.events().publish(
            (symbol_short!("field"), symbol_short!("harvest")),
            (season, harvester.clone(), pot),
        );

        // Advance or close
        let next = season + 1;
        if next >= max {
            env.storage().persistent().set(&DataKey::Status, &FieldStatus::Closed);
            env.storage().persistent().extend_ttl(&DataKey::Status, TTL_BUMP, TTL_BUMP);
            env.events().publish(
                (symbol_short!("field"), symbol_short!("closed")),
                env.ledger().timestamp(),
            );
        } else {
            env.storage().persistent().set(&DataKey::CurrentSeason, &next);
            env.storage().persistent().set(&DataKey::Planted, &Vec::<Address>::new(env));
            env.storage().persistent().set(&DataKey::SeasonStart, &env.ledger().timestamp());
            env.storage().persistent().extend_ttl(&DataKey::CurrentSeason, TTL_BUMP, TTL_BUMP);
            env.storage().persistent().extend_ttl(&DataKey::SeasonStart, TTL_BUMP, TTL_BUMP);
        }
    }

    // -----------------------------------------------------------------
    // Mark default
    // -----------------------------------------------------------------

    pub fn mark_default(env: Env, member: Address) {
        let status: FieldStatus = pget(&env, DataKey::Status);
        if status != FieldStatus::Active { panic!("field not active") }

        let members: Vec<Address> = pget(&env, DataKey::Members);
        let mut member_idx: Option<u32> = None;
        for i in 0..members.len() {
            if members.get_unchecked(i) == member {
                member_idx = Some(i);
                break;
            }
        }
        let idx = member_idx.unwrap_or_else(|| panic!("not a member"));

        // Must not have planted
        let planted: Vec<Address> = pget(&env, DataKey::Planted);
        for i in 0..planted.len() {
            if planted.get_unchecked(i) == member { panic!("already planted") }
        }

        // Deadline must have passed
        let season_start: u64 = pget(&env, DataKey::SeasonStart);
        let cycle_secs: u64   = pget(&env, DataKey::CycleSeconds);
        if env.ledger().timestamp() < season_start + cycle_secs {
            panic!("deadline not passed")
        }

        let mut defaults: Vec<u32> = pget(&env, DataKey::Defaults);
        defaults.push_back(idx);
        env.storage().persistent().set(&DataKey::Defaults, &defaults);
        env.storage().persistent().extend_ttl(&DataKey::Defaults, TTL_BUMP, TTL_BUMP);

        // Notify yield contract
        if let Some(yield_addr) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::YieldContract)
        {
            let args = soroban_sdk::vec![
                &env,
                member.to_val(),
                env.current_contract_address().to_val(),
            ];
            let _ = env.try_invoke_contract::<(), soroban_sdk::Error>(
                &yield_addr,
                &symbol_short!("rcrd_d"),
                args,
            );
        }

        env.events()
            .publish((symbol_short!("field"), symbol_short!("default")), (member, idx));
    }

    // -----------------------------------------------------------------
    // Read-only queries
    // -----------------------------------------------------------------

    pub fn get_status(env: Env) -> FieldStatus {
        pget(&env, DataKey::Status)
    }

    pub fn get_admin(env: Env) -> Address {
        pget(&env, DataKey::Admin)
    }

    pub fn get_usdc(env: Env) -> Address {
        pget(&env, DataKey::Usdc)
    }

    pub fn get_contribution_amount(env: Env) -> i128 {
        pget(&env, DataKey::ContributionAmount)
    }

    pub fn get_max_members(env: Env) -> u32 {
        pget(&env, DataKey::MaxMembers)
    }

    pub fn get_current_season(env: Env) -> u32 {
        pget(&env, DataKey::CurrentSeason)
    }

    pub fn get_members(env: Env) -> Vec<Address> {
        pget(&env, DataKey::Members)
    }

    pub fn get_harvest_order(env: Env) -> Vec<u32> {
        pget(&env, DataKey::HarvestOrder)
    }

    pub fn get_season_start(env: Env) -> u64 {
        pget(&env, DataKey::SeasonStart)
    }

    pub fn get_cycle_seconds(env: Env) -> u64 {
        pget(&env, DataKey::CycleSeconds)
    }

    pub fn get_planted_members(env: Env) -> Vec<Address> {
        pget(&env, DataKey::Planted)
    }

    pub fn get_defaults(env: Env) -> Vec<u32> {
        pget(&env, DataKey::Defaults)
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn pget<V>(env: &Env, key: DataKey) -> V
where
    V: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>
        + soroban_sdk::IntoVal<Env, soroban_sdk::Val>,
{
    env.storage().persistent().get(&key).unwrap()
}

fn require_admin(env: &Env, caller: &Address) {
    let admin: Address = pget(env, DataKey::Admin);
    if caller != &admin { panic!("not admin") }
}
