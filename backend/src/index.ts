import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { authService } from './container';
import { errorHandler } from './middleware/error-handler';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import activitiesRouter from './routes/activities';
import submissionsRouter from './routes/submissions';
import rewardsRouter from './routes/rewards';
import redemptionsRouter from './routes/redemptions';

const app = express();

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos subidos (imágenes de pruebas)
app.use('/uploads', express.static(path.resolve(config.uploadsDir)));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/redemptions', redemptionsRouter);

// Ruta raíz de salud
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'School Rewards API',
    version: '1.0.0',
    network: config.stellar.network,
    rpcUrl: config.stellar.rpcUrl,
    contract: config.stellar.contractId || 'no configurado',
    badgeContract: config.stellar.badgeContractId || 'no configurado',
    redemptionContract: config.stellar.redemptionContractId || 'no configurado',
    adminPublicKey: config.stellar.adminPublicKey || 'no configurado',
    adminSecretKey: config.stellar.adminSecretKey ? '✓ configurado' : '✗ FALTA',
    encryptionKey: config.encryptionKey ? '✓ configurado' : '✗ FALTA',
  });
});

// ── Ruta no encontrada ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo de errores centralizado ────────────────────────────────────────────
app.use(errorHandler);

// ── Inicialización ────────────────────────────────────────────────────────────

async function bootstrap() {
  await authService.seedAdmin();

  app.listen(config.port, () => {
    console.log(`\nSchool Rewards API corriendo en http://localhost:${config.port}`);
    console.log(`Red Stellar: ${config.stellar.network}`);
    console.log(`Contrato: ${config.stellar.contractId || 'no configurado (solo DB)'}`);
    console.log(`\nEndpoints disponibles:`);
    console.log(`  POST   /api/auth/register`);
    console.log(`  POST   /api/auth/login`);
    console.log(`  GET    /api/auth/me`);
    console.log(`  GET    /api/activities`);
    console.log(`  POST   /api/submissions`);
    console.log(`  GET    /api/rewards`);
    console.log(`  POST   /api/redemptions`);
    console.log(`\n  GET    /api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
