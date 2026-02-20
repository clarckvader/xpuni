import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { config } from './config';
import { db, runMigrations } from './db';
import { users } from './db/schema';
import { generateAndFundAccount } from './services/stellar';

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
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'School Rewards API',
    version: '1.0.0',
    network: config.stellar.network,
    contract: config.stellar.contractId || 'no configurado',
  });
});

// ── Manejo de errores ─────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error no manejado:', err);

  if (err.message?.includes('Solo se permiten')) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Ruta no encontrada ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Inicialización ────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Crear tablas en la base de datos
  runMigrations();
  console.log('Base de datos inicializada');

  // 2. Crear admin inicial si no existe ningún admin
  const [adminExists] = await db
    .select()
    .from(users)
    .where(eq(users.role, 'ADMIN'));

  if (!adminExists) {
    console.log('Creando usuario admin inicial...');
    try {
      const passwordHash = await bcrypt.hash(config.initialAdmin.password, 12);
      const { publicKey, encryptedSecret } = await generateAndFundAccount();

      await db.insert(users).values({
        email: config.initialAdmin.email,
        passwordHash,
        role: 'ADMIN',
        stellarPublicKey: publicKey,
        encryptedStellarSecret: encryptedSecret,
      });

      console.log(`Admin creado: ${config.initialAdmin.email}`);
    } catch (err) {
      console.error('Error al crear el admin inicial:', err);
    }
  }

  // 3. Iniciar servidor
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
    console.log(`\n  GET    /health`);
  });
}

bootstrap().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
