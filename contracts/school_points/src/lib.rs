#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

// ── Allowance types ───────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    TotalSupply,
    Balance(Address),
    Allowance(AllowanceKey),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct SchoolPoints;

#[contractimpl]
impl SchoolPoints {
    /// Inicializa el contrato. Solo puede llamarse una vez.
    pub fn initialize(env: Env, admin: Address, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::TotalSupply, &0_i128);
    }

    // ── SEP-41: Metadata ──────────────────────────────────────────────────────

    pub fn decimals(_env: Env) -> u32 {
        0
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    // ── SEP-41: Balance y Allowance ───────────────────────────────────────────

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(AllowanceKey { from, spender });
        match env
            .storage()
            .temporary()
            .get::<DataKey, AllowanceValue>(&key)
        {
            Some(v) => {
                if env.ledger().sequence() > v.expiration_ledger {
                    0
                } else {
                    v.amount
                }
            }
            None => 0,
        }
    }

    // ── SEP-41: Operaciones mutantes ──────────────────────────────────────────

    /// Acuña puntos a una dirección. Solo el admin puede llamar esto.
    pub fn mint(env: Env, to: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let bal_key = DataKey::Balance(to.clone());
        let current: i128 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        env.storage().persistent().set(&bal_key, &(current + amount));

        let supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply + amount));

        env.events()
            .publish((symbol_short!("mint"), admin, to), amount);
    }

    /// SEP-41 burn: el holder quema sus propios tokens. Requiere from.require_auth().
    pub fn burn(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        from.require_auth();

        let key = DataKey::Balance(from.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if current < amount {
            panic!("insufficient_balance");
        }
        env.storage().persistent().set(&key, &(current - amount));

        let supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply - amount));

        env.events().publish((symbol_short!("burn"), from), amount);
    }

    /// SEP-41 burn_from: un spender quema tokens en nombre de `from` consumiendo allowance.
    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        spender.require_auth();

        let allow_key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let av: AllowanceValue = env
            .storage()
            .temporary()
            .get(&allow_key)
            .unwrap_or(AllowanceValue { amount: 0, expiration_ledger: 0 });

        if env.ledger().sequence() > av.expiration_ledger {
            panic!("allowance_expired");
        }
        if av.amount < amount {
            panic!("insufficient_allowance");
        }

        env.storage().temporary().set(
            &allow_key,
            &AllowanceValue {
                amount: av.amount - amount,
                expiration_ledger: av.expiration_ledger,
            },
        );

        let key = DataKey::Balance(from.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if current < amount {
            panic!("insufficient_balance");
        }
        env.storage().persistent().set(&key, &(current - amount));

        let supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply - amount));

        env.events().publish((symbol_short!("burn"), from), amount);
    }

    /// Admin clawback: el admin quema tokens de cualquier dirección. Para redenciones.
    pub fn clawback(env: Env, from: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::Balance(from.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if current < amount {
            panic!("insufficient_balance");
        }
        env.storage().persistent().set(&key, &(current - amount));

        let supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalSupply, &(supply - amount));

        env.events().publish((symbol_short!("burn"), from), amount);
    }

    /// SEP-41 transfer: requiere from.require_auth().
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        from.require_auth();

        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient_balance");
        }

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);

        env.storage().persistent().set(&from_key, &(from_balance - amount));
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    /// SEP-41 transfer_from: un spender transfiere en nombre de `from` consumiendo allowance.
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        if amount <= 0 {
            panic!("amount_must_be_positive");
        }
        spender.require_auth();

        let allow_key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let av: AllowanceValue = env
            .storage()
            .temporary()
            .get(&allow_key)
            .unwrap_or(AllowanceValue { amount: 0, expiration_ledger: 0 });

        if env.ledger().sequence() > av.expiration_ledger {
            panic!("allowance_expired");
        }
        if av.amount < amount {
            panic!("insufficient_allowance");
        }

        env.storage().temporary().set(
            &allow_key,
            &AllowanceValue {
                amount: av.amount - amount,
                expiration_ledger: av.expiration_ledger,
            },
        );

        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient_balance");
        }

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);

        env.storage().persistent().set(&from_key, &(from_balance - amount));
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        env.events()
            .publish((symbol_short!("transfer"), from, to), amount);
    }

    /// SEP-41 approve: otorga a `spender` permiso de gastar `amount` tokens de `from`.
    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) {
        from.require_auth();

        if expiration_ledger < env.ledger().sequence() {
            panic!("expiration_ledger_in_past");
        }

        let key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });

        env.storage()
            .temporary()
            .set(&key, &AllowanceValue { amount, expiration_ledger });

        let ledgers_until_expiry = expiration_ledger.saturating_sub(env.ledger().sequence());
        env.storage()
            .temporary()
            .extend_ttl(&key, ledgers_until_expiry, ledgers_until_expiry);

        env.events()
            .publish((symbol_short!("approve"), from, spender), (amount, expiration_ledger));
    }

    /// Transfiere el rol de admin a una nueva dirección. Requiere auth del admin actual.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }
}

mod test;
