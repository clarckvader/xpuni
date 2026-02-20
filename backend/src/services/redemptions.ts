import {
  Keypair,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Contract,
  Address,
  nativeToScVal,
  rpc,
} from '@stellar/stellar-sdk';
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

function getRedemptionContract(): Contract {
  if (!config.stellar.redemptionContractId) {
    throw new Error(
      'STELLAR_REDEMPTION_CONTRACT_ID no está configurado. Despliega el contrato redemption_records primero.',
    );
  }
  return new Contract(config.stellar.redemptionContractId);
}

/**
 * Registra un canje on-chain en el contrato redemption_records.
 * Debe llamarse DESPUÉS de que burnPoints haya sido confirmado.
 *
 * @param studentPublicKey  Clave pública Stellar del estudiante (G...)
 * @param rewardName        Nombre de la recompensa (snapshot, guardado on-chain)
 * @param pointsSpent       Puntos descontados (debe coincidir con el burn TX)
 * @returns                 Hash de la transacción de registro
 */
export async function recordRedemption(
  studentPublicKey: string,
  rewardName: string,
  pointsSpent: number,
): Promise<string> {
  const server = getRpcServer();
  const contract = getRedemptionContract();
  const adminKeypair = getAdminKeypair();

  const account = await server.getAccount(adminKeypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
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

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Error al simular record_redemption: ${simResult.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  prepared.sign(adminKeypair);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === 'ERROR') {
    throw new Error(
      `Error al enviar tx de record_redemption: ${JSON.stringify(sendResult.errorResult)}`,
    );
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
