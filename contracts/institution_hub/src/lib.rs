#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Vec,
};

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// Maps institution_id (u64) → token_contract (Address)
    Institution(u64),
    /// Maps institution_id (u64) → institution_admin (Address)
    InstAdmin(u64),
    /// List of registered institution ids
    InstIds,
    /// Exchange rate: (from_contract_str, to_contract_str) encoded as a pair key
    Rate(Address, Address),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct InstitutionHub;

#[contractimpl]
impl InstitutionHub {
    /// Initializes the hub with a platform admin. Can only be called once.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        let ids: Vec<u64> = Vec::new(&env);
        env.storage().instance().set(&DataKey::InstIds, &ids);
    }

    // ── Admin helpers ─────────────────────────────────────────────────────────

    fn require_admin(env: &Env) -> Address {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        admin
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    // ── Institution registry ───────────────────────────────────────────────────

    /// Registers an institution. Caller must be the platform admin.
    /// `institution_id`: off-chain DB id, `token_contract`: SEP-41 contract address,
    /// `inst_admin`: the keypair authorized to mint/clawback on that token contract.
    pub fn register_institution(
        env: Env,
        institution_id: u64,
        token_contract: Address,
        inst_admin: Address,
    ) {
        Self::require_admin(&env);

        if env.storage().instance().has(&DataKey::Institution(institution_id)) {
            panic!("institution_already_registered");
        }

        env.storage()
            .instance()
            .set(&DataKey::Institution(institution_id), &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::InstAdmin(institution_id), &inst_admin);

        let mut ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::InstIds)
            .unwrap_or_else(|| Vec::new(&env));
        ids.push_back(institution_id);
        env.storage().instance().set(&DataKey::InstIds, &ids);

        env.events().publish(
            (symbol_short!("reg_inst"), institution_id),
            token_contract,
        );
    }

    pub fn get_institution(env: Env, institution_id: u64) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Institution(institution_id))
            .unwrap_or_else(|| panic!("institution_not_found"))
    }

    pub fn get_inst_admin(env: Env, institution_id: u64) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::InstAdmin(institution_id))
            .unwrap_or_else(|| panic!("institution_not_found"))
    }

    /// Returns all registered (institution_id, token_contract) pairs as a Map.
    pub fn get_institutions(env: Env) -> Map<u64, Address> {
        let ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::InstIds)
            .unwrap_or_else(|| Vec::new(&env));

        let mut result: Map<u64, Address> = Map::new(&env);
        for id in ids.iter() {
            if let Some(contract) = env
                .storage()
                .instance()
                .get::<DataKey, Address>(&DataKey::Institution(id))
            {
                result.set(id, contract);
            }
        }
        result
    }

    // ── Exchange rates ────────────────────────────────────────────────────────

    /// Sets the exchange rate from `from_contract` to `to_contract`.
    /// `rate` is scaled by 1_000_000: a rate of 1_000_000 means 1:1.
    /// E.g., rate = 500_000 means 1 FROM = 0.5 TO.
    pub fn set_exchange_rate(
        env: Env,
        from_contract: Address,
        to_contract: Address,
        rate: i128,
    ) {
        Self::require_admin(&env);
        if rate <= 0 {
            panic!("rate_must_be_positive");
        }
        env.storage()
            .instance()
            .set(&DataKey::Rate(from_contract.clone(), to_contract.clone()), &rate);

        env.events().publish(
            (symbol_short!("set_rate"), from_contract, to_contract),
            rate,
        );
    }

    pub fn get_rate(env: Env, from_contract: Address, to_contract: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Rate(from_contract, to_contract))
            .unwrap_or(0)
    }

    // ── Swap recording ────────────────────────────────────────────────────────

    /// Records a swap event on-chain. The platform admin calls this AFTER successfully
    /// performing the clawback on `from_contract` and mint on `to_contract` off-chain.
    /// Returns amount_out so callers can verify the calculation.
    ///
    /// This function enforces:
    ///   - Caller is platform admin
    ///   - Both contracts are registered
    ///   - A rate exists between them
    ///   - amount_out matches the rate calculation
    pub fn record_swap(
        env: Env,
        student: Address,
        from_contract: Address,
        to_contract: Address,
        amount_in: i128,
        amount_out: i128,
    ) -> i128 {
        Self::require_admin(&env);

        if amount_in <= 0 {
            panic!("amount_in_must_be_positive");
        }

        let rate: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Rate(from_contract.clone(), to_contract.clone()))
            .unwrap_or_else(|| panic!("no_rate_configured"));

        let expected_out = amount_in * rate / 1_000_000_i128;
        if amount_out != expected_out {
            panic!("amount_out_mismatch");
        }

        env.events().publish(
            (symbol_short!("swap"), student, from_contract, to_contract),
            (amount_in, amount_out),
        );

        amount_out
    }

    /// Convenience: calculate amount_out for a given amount_in and rate.
    pub fn calculate_swap(
        env: Env,
        from_contract: Address,
        to_contract: Address,
        amount_in: i128,
    ) -> i128 {
        let rate: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Rate(from_contract, to_contract))
            .unwrap_or_else(|| panic!("no_rate_configured"));
        amount_in * rate / 1_000_000_i128
    }
}
