import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  xdr,
  rpc,
} from '@stellar/stellar-sdk';
import { createHash } from 'crypto';
import { config } from '../config';

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

function getBadgeContract(): Contract {
  if (!config.stellar.badgeContractId) {
    throw new Error(
      'STELLAR_BADGE_CONTRACT_ID no está configurado. Despliega el contrato achievement_badges primero.',
    );
  }
  return new Contract(config.stellar.badgeContractId);
}

/**
 * Calcula el SHA-256 del texto de la descripción de una submission.
 * Se envía como BytesN<32> al contrato para anclar la integridad del texto on-chain.
 */
export function computeDescriptionHash(description: string): Buffer {
  return createHash('sha256').update(description, 'utf8').digest();
}

/**
 * Emite un badge de logro on-chain en el contrato achievement_badges.
 *
 * @param studentPublicKey  Clave pública Stellar del estudiante (G...)
 * @param activityId        ID de la actividad en la base de datos
 * @param activityTitle     Título de la actividad (guardado on-chain)
 * @param imageUri          URI de la imagen del badge (URL HTTPS o ipfs://...)
 * @param pointsAwarded     Puntos otorgados (igual que activity.pointsReward)
 * @param descriptionHash   SHA-256 de 32 bytes de la descripción de la submission
 * @returns                 Hash de la transacción de issuance
 */
export async function issueBadge(
  studentPublicKey: string,
  activityId: number,
  activityTitle: string,
  imageUri: string,
  pointsAwarded: number,
  descriptionHash: Buffer,
): Promise<string> {
  const server = getRpcServer();
  const contract = getBadgeContract();
  const adminKeypair = getAdminKeypair();

  const account = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
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

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Error al simular issue_badge: ${simResult.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  prepared.sign(adminKeypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === 'ERROR') {
    throw new Error(`Error al enviar tx de issue_badge: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const txHash = sendResult.hash;
  await waitForTransaction(server, txHash);

  return txHash;
}

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
