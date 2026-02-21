import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc,
} from '@stellar/stellar-sdk';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { AppConfig } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class StellarService {
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;

  constructor(private readonly config: AppConfig) {
    this.server = new rpc.Server(config.stellar.rpcUrl, { allowHttp: false });
    this.networkPassphrase =
      config.stellar.network === 'mainnet'
        ? Networks.PUBLIC
        : config.stellar.networkPassphrase || Networks.TESTNET;
  }

  // ── Encryption ──────────────────────────────────────────────────────────────

  encryptSecret(secret: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decryptSecret(encryptedBase64: string): string {
    const key = this.getEncryptionKey();
    const data = Buffer.from(encryptedBase64, 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  // ── Account generation ───────────────────────────────────────────────────

  async generateAndFundAccount(): Promise<{ publicKey: string; encryptedSecret: string }> {
    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();
    const encryptedSecret = this.encryptSecret(keypair.secret());

    if (this.config.stellar.network === 'testnet') {
      try {
        const response = await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
        );
        if (!response.ok) {
          console.warn(
            `Friendbot no pudo fondear la cuenta ${publicKey}: ${response.statusText}`,
          );
        }
      } catch (err) {
        console.warn('Error al llamar a Friendbot (la cuenta no tendrá saldo inicial):', err);
      }
    }

    return { publicKey, encryptedSecret };
  }

  // ── On-chain balance ─────────────────────────────────────────────────────

  async getBalance(studentPublicKey: string): Promise<bigint> {
    console.log(`[balance] Consultando saldo de ${studentPublicKey}`);
    if (!this.config.stellar.contractId) {
      console.warn('[balance] STELLAR_CONTRACT_ID no configurado, retornando saldo 0');
      return 0n;
    }

    const contract = this.getPointsContract();
    const adminKeypair = this.getAdminKeypair();

    const account = await this.server.getAccount(adminKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call('balance', new Address(studentPublicKey).toScVal()))
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Error al simular balance: ${simResult.error}`);
    }
    if (!simResult.result?.retval) return 0n;

    const native = scValToNative(simResult.result.retval);
    return typeof native === 'bigint' ? native : BigInt(String(native));
  }

  // ── Mint / Burn ──────────────────────────────────────────────────────────

  async mintPoints(toPublicKey: string, amount: number): Promise<string> {
    console.log(`[mint] Iniciando mint de ${amount} pts → ${toPublicKey}`);
    const contract = this.getPointsContract();
    const adminKeypair = this.getAdminKeypair();

    const account = await this.server.getAccount(adminKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'mint',
          new Address(toPublicKey).toScVal(),
          nativeToScVal(BigInt(amount), { type: 'i128' }),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Error al simular mint: ${simResult.error}`);
    }

    const prepared = rpc.assembleTransaction(tx, simResult).build();
    prepared.sign(adminKeypair);

    const sendResult = await this.server.sendTransaction(prepared);
    if (sendResult.status === 'ERROR') {
      throw new Error(`Error al enviar tx de mint: ${JSON.stringify(sendResult.errorResult)}`);
    }

    const txHash = sendResult.hash;
    await this.waitForTransaction(txHash);
    console.log(`[mint] ✓ Confirmada: ${txHash}`);
    return txHash;
  }

  async burnPoints(fromPublicKey: string, amount: number): Promise<string> {
    const contract = this.getPointsContract();
    const adminKeypair = this.getAdminKeypair();

    const account = await this.server.getAccount(adminKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'clawback',
          new Address(fromPublicKey).toScVal(),
          nativeToScVal(BigInt(amount), { type: 'i128' }),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Error al simular clawback: ${simResult.error}`);
    }

    const prepared = rpc.assembleTransaction(tx, simResult).build();
    prepared.sign(adminKeypair);

    const sendResult = await this.server.sendTransaction(prepared);
    if (sendResult.status === 'ERROR') {
      throw new Error(
        `Error al enviar tx de clawback: ${JSON.stringify(sendResult.errorResult)}`,
      );
    }

    const txHash = sendResult.hash;
    await this.waitForTransaction(txHash);
    return txHash;
  }

  // ── Badge issuance ───────────────────────────────────────────────────────

  computeDescriptionHash(description: string): Buffer {
    return createHash('sha256').update(description, 'utf8').digest();
  }

  async issueBadge(
    studentPublicKey: string,
    activityId: number,
    activityTitle: string,
    imageUri: string,
    pointsAwarded: number,
    descriptionHash: Buffer,
  ): Promise<string> {
    const contract = this.getBadgeContract();
    const adminKeypair = this.getAdminKeypair();

    const account = await this.server.getAccount(adminKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'issue_badge',
          new Address(studentPublicKey).toScVal(),
          nativeToScVal(BigInt(activityId), { type: 'u64' }),
          nativeToScVal(activityTitle, { type: 'string' }),
          nativeToScVal(imageUri, { type: 'string' }),
          nativeToScVal(BigInt(pointsAwarded), { type: 'i128' }),
          xdr.ScVal.scvBytes(descriptionHash),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Error al simular issue_badge: ${simResult.error}`);
    }

    const prepared = rpc.assembleTransaction(tx, simResult).build();
    prepared.sign(adminKeypair);

    const sendResult = await this.server.sendTransaction(prepared);
    if (sendResult.status === 'ERROR') {
      throw new Error(
        `Error al enviar tx de issue_badge: ${JSON.stringify(sendResult.errorResult)}`,
      );
    }

    const txHash = sendResult.hash;
    await this.waitForTransaction(txHash);
    return txHash;
  }

  // ── Redemption recording ─────────────────────────────────────────────────

  async recordRedemption(
    studentPublicKey: string,
    rewardName: string,
    pointsSpent: number,
  ): Promise<string> {
    const contract = this.getRedemptionContract();
    const adminKeypair = this.getAdminKeypair();

    const account = await this.server.getAccount(adminKeypair.publicKey());
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'record_redemption',
          new Address(studentPublicKey).toScVal(),
          nativeToScVal(rewardName, { type: 'string' }),
          nativeToScVal(BigInt(pointsSpent), { type: 'i128' }),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Error al simular record_redemption: ${simResult.error}`);
    }

    const prepared = rpc.assembleTransaction(tx, simResult).build();
    prepared.sign(adminKeypair);

    const sendResult = await this.server.sendTransaction(prepared);
    if (sendResult.status === 'ERROR') {
      throw new Error(
        `Error al enviar tx de record_redemption: ${JSON.stringify(sendResult.errorResult)}`,
      );
    }

    const txHash = sendResult.hash;
    await this.waitForTransaction(txHash);
    return txHash;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private getEncryptionKey(): Buffer {
    const hex = this.config.encryptionKey;
    if (hex.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY debe tener exactamente 64 caracteres hexadecimales (32 bytes)',
      );
    }
    return Buffer.from(hex, 'hex');
  }

  private getAdminKeypair(): Keypair {
    if (!this.config.stellar.adminSecretKey) {
      throw new Error('STELLAR_ADMIN_SECRET_KEY no está configurado');
    }
    return Keypair.fromSecret(this.config.stellar.adminSecretKey);
  }

  private getPointsContract(): Contract {
    if (!this.config.stellar.contractId) {
      throw new Error(
        'STELLAR_CONTRACT_ID no está configurado. Despliega el contrato school_points primero.',
      );
    }
    return new Contract(this.config.stellar.contractId);
  }

  private getBadgeContract(): Contract {
    if (!this.config.stellar.badgeContractId) {
      throw new Error(
        'STELLAR_BADGE_CONTRACT_ID no está configurado. Despliega el contrato achievement_badges primero.',
      );
    }
    return new Contract(this.config.stellar.badgeContractId);
  }

  private getRedemptionContract(): Contract {
    if (!this.config.stellar.redemptionContractId) {
      throw new Error(
        'STELLAR_REDEMPTION_CONTRACT_ID no está configurado. Despliega el contrato redemption_records primero.',
      );
    }
    return new Contract(this.config.stellar.redemptionContractId);
  }

  private async waitForTransaction(
    txHash: string,
    maxAttempts = 20,
    intervalMs = 1500,
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.server.getTransaction(txHash);
      if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) return;
      if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`La transacción ${txHash} falló en la red`);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timeout esperando confirmación de la transacción ${txHash}`);
  }
}
