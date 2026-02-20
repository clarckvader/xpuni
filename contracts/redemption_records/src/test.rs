#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

fn setup(env: &Env) -> (RedemptionRecordsClient, Address) {
    let contract_id = env.register(RedemptionRecords, ());
    let client = RedemptionRecordsClient::new(env, &contract_id);
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
    assert_eq!(client.record_count(), 0);
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
fn test_record_and_get() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);

    let record_id = client.record_redemption(
        &student,
        &String::from_str(&env, "Pizza de pepperoni"),
        &150_i128,
    );

    assert_eq!(record_id, 0);
    assert_eq!(client.record_count(), 1);

    let record = client.get_record(&0_u64);
    assert_eq!(record.record_id, 0);
    assert_eq!(record.student, student);
    assert_eq!(record.reward_name, String::from_str(&env, "Pizza de pepperoni"));
    assert_eq!(record.points_spent, 150);
}

#[test]
fn test_multiple_records_increment_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);

    let id0 = client.record_redemption(
        &student,
        &String::from_str(&env, "Bono de nota"),
        &200_i128,
    );
    let id1 = client.record_redemption(
        &student,
        &String::from_str(&env, "Libro de Rust"),
        &100_i128,
    );

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(client.record_count(), 2);
}

#[test]
fn test_get_student_records() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);

    client.record_redemption(&s1, &String::from_str(&env, "Premio A"), &50_i128);
    client.record_redemption(&s2, &String::from_str(&env, "Premio B"), &75_i128);
    client.record_redemption(&s1, &String::from_str(&env, "Premio C"), &100_i128);

    let s1_records = client.get_student_records(&s1);
    let s2_records = client.get_student_records(&s2);

    assert_eq!(s1_records.len(), 2);
    assert_eq!(s2_records.len(), 1);
    assert_eq!(s1_records.get(0).unwrap(), 0_u64);
    assert_eq!(s1_records.get(1).unwrap(), 2_u64);
    assert_eq!(s2_records.get(0).unwrap(), 1_u64);
}

#[test]
fn test_get_student_records_empty() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let student = Address::generate(&env);
    let records = client.get_student_records(&student);
    assert_eq!(records.len(), 0);
}

#[test]
#[should_panic(expected = "record_not_found")]
fn test_get_nonexistent_record() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    client.get_record(&999_u64);
}
