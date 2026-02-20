#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

fn setup(env: &Env) -> (SchoolPointsClient, Address) {
    let contract_id = env.register(SchoolPoints, ());
    let client = SchoolPointsClient::new(env, &contract_id);
    let admin = Address::generate(env);
    client.initialize(
        &admin,
        &String::from_str(env, "School Points"),
        &String::from_str(env, "SPTS"),
    );
    (client, admin)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    assert_eq!(client.admin(), admin);
    assert_eq!(client.name(), String::from_str(&env, "School Points"));
    assert_eq!(client.symbol(), String::from_str(&env, "SPTS"));
    assert_eq!(client.decimals(), 0);
    assert_eq!(client.total_supply(), 0);
}

#[test]
#[should_panic(expected = "already_initialized")]
fn test_double_initialize_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    client.initialize(
        &admin,
        &String::from_str(&env, "School Points"),
        &String::from_str(&env, "SPTS"),
    );
}

#[test]
fn test_mint_and_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);

    assert_eq!(client.balance(&student), 0);
    client.mint(&student, &100_i128);
    assert_eq!(client.balance(&student), 100);
    assert_eq!(client.total_supply(), 100);

    client.mint(&student, &50_i128);
    assert_eq!(client.balance(&student), 150);
    assert_eq!(client.total_supply(), 150);
}

#[test]
fn test_burn_by_holder() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);

    client.mint(&student, &200_i128);
    client.burn(&student, &80_i128);
    assert_eq!(client.balance(&student), 120);
    assert_eq!(client.total_supply(), 120);
}

#[test]
#[should_panic(expected = "insufficient_balance")]
fn test_burn_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);

    client.mint(&student, &50_i128);
    client.burn(&student, &100_i128);
}

#[test]
fn test_clawback_by_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);

    client.mint(&student, &200_i128);
    client.clawback(&student, &80_i128);
    assert_eq!(client.balance(&student), 120);
    assert_eq!(client.total_supply(), 120);
}

#[test]
#[should_panic(expected = "insufficient_balance")]
fn test_clawback_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);

    client.mint(&student, &50_i128);
    client.clawback(&student, &100_i128);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);

    client.mint(&s1, &100_i128);
    client.transfer(&s1, &s2, &40_i128);

    assert_eq!(client.balance(&s1), 60);
    assert_eq!(client.balance(&s2), 40);
    assert_eq!(client.total_supply(), 100);
}

#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.mint(&owner, &100_i128);
    client.approve(&owner, &spender, &50_i128, &(env.ledger().sequence() + 1000));
    assert_eq!(client.allowance(&owner, &spender), 50);

    client.transfer_from(&spender, &owner, &recipient, &30_i128);
    assert_eq!(client.balance(&owner), 70);
    assert_eq!(client.balance(&recipient), 30);
    assert_eq!(client.allowance(&owner, &spender), 20);
}

#[test]
fn test_approve_and_burn_from() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let owner = Address::generate(&env);
    let spender = Address::generate(&env);

    client.mint(&owner, &100_i128);
    client.approve(&owner, &spender, &60_i128, &(env.ledger().sequence() + 1000));

    client.burn_from(&spender, &owner, &40_i128);
    assert_eq!(client.balance(&owner), 60);
    assert_eq!(client.allowance(&owner, &spender), 20);
    assert_eq!(client.total_supply(), 60);
}

#[test]
fn test_set_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let new_admin = Address::generate(&env);

    client.set_admin(&new_admin);
    assert_eq!(client.admin(), new_admin);
}

#[test]
#[should_panic(expected = "amount_must_be_positive")]
fn test_mint_negative_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let student = Address::generate(&env);
    client.mint(&student, &-10_i128);
}
