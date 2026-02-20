#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

// ── Data structures ───────────────────────────────────────────────────────────

/// Registro inmutable de un canje de recompensa.
/// Complementa el TX de `clawback` (burn de puntos) con el contexto del canje:
/// qué recompensa se obtuvo y cuántos puntos se gastaron.
#[contracttype]
#[derive(Clone)]
pub struct RedemptionRecord {
    pub record_id: u64,
    /// Wallet del estudiante que realizó el canje.
    pub student: Address,
    /// Nombre de la recompensa canjeada (snapshot al momento del canje).
    pub reward_name: String,
    /// Puntos descontados on-chain (debe coincidir con el burn TX).
    pub points_spent: i128,
    /// Timestamp Unix del ledger en el momento del canje.
    pub redeemed_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RecordCount,
    Record(u64),
    StudentRecords(Address),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct RedemptionRecords;

#[contractimpl]
impl RedemptionRecords {
    /// Inicializa el contrato con el admin. Solo puede llamarse una vez.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RecordCount, &0_u64);
    }

    /// Registra un canje on-chain. Solo el admin puede llamar esto.
    /// Retorna el record_id asignado.
    pub fn record_redemption(
        env: Env,
        student: Address,
        reward_name: String,
        points_spent: i128,
    ) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let record_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RecordCount)
            .unwrap_or(0);

        let record = RedemptionRecord {
            record_id,
            student: student.clone(),
            reward_name,
            points_spent,
            redeemed_at: env.ledger().timestamp(),
        };

        // Persistir registro con TTL extendido (~10M ledgers ≈ varios años)
        env.storage()
            .persistent()
            .set(&DataKey::Record(record_id), &record);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Record(record_id), 10_000_000, 10_000_000);

        // Actualizar lista de canjes del estudiante
        let mut student_records: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::StudentRecords(student.clone()))
            .unwrap_or_else(|| Vec::new(&env));

        student_records.push_back(record_id);

        env.storage()
            .persistent()
            .set(&DataKey::StudentRecords(student.clone()), &student_records);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::StudentRecords(student.clone()), 10_000_000, 10_000_000);

        // Incrementar contador
        env.storage()
            .instance()
            .set(&DataKey::RecordCount, &(record_id + 1));

        // Emitir evento on-chain
        env.events()
            .publish((symbol_short!("redeem"), student, record_id), record_id);

        record_id
    }

    /// Retorna el registro de un canje por su ID.
    pub fn get_record(env: Env, record_id: u64) -> RedemptionRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Record(record_id))
            .unwrap_or_else(|| panic!("record_not_found"))
    }

    /// Retorna todos los record IDs de un estudiante.
    pub fn get_student_records(env: Env, student: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::StudentRecords(student))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Retorna el total de canjes registrados.
    pub fn record_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::RecordCount)
            .unwrap_or(0)
    }

    /// Retorna la dirección del admin.
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

mod test;
