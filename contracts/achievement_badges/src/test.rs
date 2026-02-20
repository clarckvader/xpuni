#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, BytesN, Env, String};

fn setup(env: &Env) -> (AchievementBadgesClient, Address) {
    let contract_id = env.register(AchievementBadges, ());
    let client = AchievementBadgesClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(&admin);
    (client, admin)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    assert_eq!(client.admin(), admin);
    assert_eq!(client.badge_count(), 0);
}

#[test]
#[should_panic(expected = "already_initialized")]
fn test_double_initialize_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    client.initialize(&admin);
}

#[test]
fn test_issue_and_get_badge() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);
    let hash = BytesN::from_array(&env, &[0u8; 32]);

    let badge_id = client.issue_badge(
        &student,
        &1_u64,
        &String::from_str(&env, "Taller de Robotica"),
        &String::from_str(&env, "https://universidad.edu/badges/robotica.png"),
        &100_i128,
        &hash,
    );

    assert_eq!(badge_id, 0);
    assert_eq!(client.badge_count(), 1);

    let badge = client.get_badge(&0_u64);
    assert_eq!(badge.badge_id, 0);
    assert_eq!(badge.student, student);
    assert_eq!(badge.activity_id, 1);
    assert_eq!(badge.points_awarded, 100);
    assert_eq!(badge.description_hash, hash);
}

#[test]
fn test_multiple_badges_increment_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);
    let hash = BytesN::from_array(&env, &[0u8; 32]);

    let id0 = client.issue_badge(
        &student,
        &1_u64,
        &String::from_str(&env, "Actividad A"),
        &String::from_str(&env, "https://universidad.edu/badges/actividad-a.png"),
        &50_i128,
        &hash,
    );
    let id1 = client.issue_badge(
        &student,
        &2_u64,
        &String::from_str(&env, "Actividad B"),
        &String::from_str(&env, "https://universidad.edu/badges/actividad-b.png"),
        &75_i128,
        &hash,
    );

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(client.badge_count(), 2);
}

#[test]
fn test_get_student_badges() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let hash = BytesN::from_array(&env, &[0u8; 32]);

    let img = String::from_str(&env, "https://universidad.edu/badges/default.png");
    client.issue_badge(&s1, &1_u64, &String::from_str(&env, "Act A"), &img, &50_i128, &hash);
    client.issue_badge(&s2, &2_u64, &String::from_str(&env, "Act B"), &img, &60_i128, &hash);
    client.issue_badge(&s1, &3_u64, &String::from_str(&env, "Act C"), &img, &70_i128, &hash);

    let s1_badges = client.get_student_badges(&s1);
    let s2_badges = client.get_student_badges(&s2);

    assert_eq!(s1_badges.len(), 2);
    assert_eq!(s2_badges.len(), 1);
    assert_eq!(s1_badges.get(0).unwrap(), 0_u64);
    assert_eq!(s1_badges.get(1).unwrap(), 2_u64);
    assert_eq!(s2_badges.get(0).unwrap(), 1_u64);
}

#[test]
fn test_get_student_badges_empty() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);
    let badges = client.get_student_badges(&student);
    assert_eq!(badges.len(), 0);
}

#[test]
#[should_panic(expected = "badge_not_found")]
fn test_get_nonexistent_badge() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    client.get_badge(&999_u64);
}
