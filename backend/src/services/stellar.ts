import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// ── Cifrado de claves ──────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const hex = config.encryptionKey;
  if (hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY debe tener exactamente 64 caracteres hexadecimales (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedBase64, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// ── Generación de cuentas ─────────────────────────────────────────────────────

export interface GeneratedAccount {
  publicKey: string;
  encryptedSecret: string;
}

export async function generateAndFundAccount(): Promise<GeneratedAccount> {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const encryptedSecret = encryptSecret(keypair.secret());

  if (config.stellar.network === 'testnet') {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
      );
      if (!response.ok) {
        console.warn(`Friendbot no pudo fondear la cuenta ${publicKey}: ${response.statusText}`);
      }
    } catch (err) {
      console.warn('Error al llamar a Friendbot (la cuenta no tendrá saldo inicial):', err);
    }
  }

  return { publicKey, encryptedSecret };
}

// ── Cliente RPC ───────────────────────────────────────────────────────────────

function getRpcServer(): rpc.Server {
  return new rpc.Server(config.stellar.rpcUrl, { allowHttp: false });
}

function getNetworkPassphrase(): string {
  if (config.stellar.network === 'mainnet') {
    return Networks.PUBLIC;
  }
  return config.stellar.networkPassphrase || Networks.TESTNET;
}

function getAdminKeypair(): Keypair {
  if (!config.stellar.adminSecretKey) {
    throw new Error('STELLAR_ADMIN_SECRET_KEY no está configurado');
  }
  return Keypair.fromSecret(config.stellar.adminSecretKey);
}

function getContract(): Contract {
  if (!config.stellar.contractId) {
    throw new Error(
      'STELLAR_CONTRACT_ID no está configurado. Despliega el contrato school_points primero.',
    );
  }
  return new Contract(config.stellar.contractId);
}

// ── Funciones del contrato ────────────────────────────────────────────────────

/**
 * Consulta el saldo de puntos de un estudiante en el contrato Soroban.
 * Usa simulación (lectura) sin enviar transacción.
 */
export async function getBalance(studentPublicKey: string): Promise<bigint> {
  if (!config.stellar.contractId) {
    console.warn('STELLAR_CONTRACT_ID no configurado, retornando saldo 0');
    return 0n;
  }

  const server = getRpcServer();
  const contract = getContract();
  const adminKeypair = getAdminKeypair();

  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      contract.call('balance', new Address(studentPublicKey).toScVal()),
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Error al simular balance: ${simResult.error}`);
  }

  if (!simResult.result?.retval) {
    return 0n;
  }

  const native = scValToNative(simResult.result.retval);
  return typeof native === 'bigint' ? native : BigInt(String(native));
}

/**
 * Acuña (mint) puntos a un estudiante. Requiere admin auth.
 * Retorna el hash de la transacción.
 */
export async function mintPoints(
  toPublicKey: string,
  amount: number,
): Promise<string> {
  const server = getRpcServer();
  const contract = getContract();
  const adminKeypair = getAdminKeypair();

  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
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

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Error al simular mint: ${simResult.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  prepared.sign(adminKeypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === 'ERROR') {
    throw new Error(`Error al enviar tx de mint: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Esperar confirmación
  const txHash = sendResult.hash;
  await waitForTransaction(server, txHash);

  return txHash;
}

/**
 * Clawback (burn admin-controlado) de puntos de un estudiante.
 * Llama `clawback` en el contrato SEP-41 — solo requiere firma del admin.
 * Usado en redenciones donde el backend descuenta puntos por cuenta del estudiante.
 */
export async function burnPoints(
  fromPublicKey: string,
  amount: number,
): Promise<string> {
  const server = getRpcServer();
  const contract = getContract();
  const adminKeypair = getAdminKeypair();

  const account = await server.getAccount(adminKeypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
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

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Error al simular clawback: ${simResult.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  prepared.sign(adminKeypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === 'ERROR') {
    throw new Error(`Error al enviar tx de clawback: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const txHash = sendResult.hash;
  await waitForTransaction(server, txHash);

  return txHash;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Espera a que una transacción sea confirmada en la red.
 */
async function waitForTransaction(
  server: rpc.Server,
  txHash: string,
  maxAttempts = 20,
  intervalMs = 1500,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await server.getTransaction(txHash);
    if (response.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return;
    }
    if (response.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`La transacción ${txHash} falló en la red`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timeout esperando confirmación de la transacción ${txHash}`);
}
