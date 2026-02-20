#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String, Vec,
};

// ── Data structures ───────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct BadgeData {
    pub badge_id: u64,
    pub student: Address,
    pub activity_id: u64,
    pub activity_title: String,
    /// URI de la imagen del badge. Puede ser una URL HTTPS o un hash IPFS (ipfs://Qm...).
    /// La imagen real vive fuera de la cadena; este campo ancla su referencia on-chain.
    pub image_uri: String,
    pub reviewer: Address,
    pub points_awarded: i128,
    pub issued_at: u64,
    pub description_hash: BytesN<32>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    BadgeCount,
    Badge(u64),
    StudentBadges(Address),
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct AchievementBadges;

#[contractimpl]
impl AchievementBadges {
    /// Inicializa el contrato con el admin. Solo puede llamarse una vez.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already_initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BadgeCount, &0_u64);
    }

    /// Emite un badge de logro a un estudiante. Solo el admin puede llamar esto.
    /// Retorna el badge_id asignado.
    pub fn issue_badge(
        env: Env,
        student: Address,
        activity_id: u64,
        activity_title: String,
        image_uri: String,
        points_awarded: i128,
        description_hash: BytesN<32>,
    ) -> u64 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let badge_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::BadgeCount)
            .unwrap_or(0);

        let badge = BadgeData {
            badge_id,
            student: student.clone(),
            activity_id,
            activity_title,
            image_uri,
            reviewer: admin,
            points_awarded,
            issued_at: env.ledger().timestamp(),
            description_hash,
        };

        // Persistir badge con TTL extendido (~10M ledgers ≈ varios años)
        env.storage()
            .persistent()
            .set(&DataKey::Badge(badge_id), &badge);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Badge(badge_id), 10_000_000, 10_000_000);

        // Actualizar lista de badges del estudiante
        let mut student_badges: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::StudentBadges(student.clone()))
            .unwrap_or_else(|| Vec::new(&env));

        student_badges.push_back(badge_id);

        env.storage()
            .persistent()
            .set(&DataKey::StudentBadges(student.clone()), &student_badges);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::StudentBadges(student.clone()), 10_000_000, 10_000_000);

        // Incrementar contador
        env.storage()
            .instance()
            .set(&DataKey::BadgeCount, &(badge_id + 1));

        // Emitir evento on-chain
        env.events()
            .publish((symbol_short!("badge"), student, badge_id), badge_id);

        badge_id
    }

    /// Retorna los datos de un badge por su ID.
    pub fn get_badge(env: Env, badge_id: u64) -> BadgeData {
        env.storage()
            .persistent()
            .get(&DataKey::Badge(badge_id))
            .unwrap_or_else(|| panic!("badge_not_found"))
    }

    /// Retorna todos los badge IDs de un estudiante.
    pub fn get_student_badges(env: Env, student: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::StudentBadges(student))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Retorna el total de badges emitidos.
    pub fn badge_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::BadgeCount)
            .unwrap_or(0)
    }

    /// Retorna la dirección del admin.
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

mod test;
