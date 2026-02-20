import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable de entorno requerida: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  // Clave de cifrado para los secrets de Stellar (32 bytes en hex = 64 chars)
  encryptionKey: required('ENCRYPTION_KEY'),

  // Stellar
  stellar: {
    network: optional('STELLAR_NETWORK', 'testnet') as 'testnet' | 'mainnet',
    rpcUrl: optional('STELLAR_RPC_URL', 'https://soroban-testnet.stellar.org'),
    networkPassphrase: optional(
      'STELLAR_NETWORK_PASSPHRASE',
      'Test SDF Network ; September 2015',
    ),
    adminPublicKey: process.env['STELLAR_ADMIN_PUBLIC_KEY'] ?? '',
    adminSecretKey: process.env['STELLAR_ADMIN_SECRET_KEY'] ?? '',
    contractId: process.env['STELLAR_CONTRACT_ID'] ?? '',
    badgeContractId: process.env['STELLAR_BADGE_CONTRACT_ID'] ?? '',
    redemptionContractId: process.env['STELLAR_REDEMPTION_CONTRACT_ID'] ?? '',
  },

  uploadsDir: optional('UPLOADS_DIR', './uploads'),
  uploadsBaseUrl: optional('UPLOADS_BASE_URL', 'http://localhost:3000'),

  databasePath: optional('DATABASE_PATH', './school.db'),

  initialAdmin: {
    email: optional('INITIAL_ADMIN_EMAIL', 'admin@universidad.edu'),
    password: optional('INITIAL_ADMIN_PASSWORD', 'admin123'),
  },
} as const;
