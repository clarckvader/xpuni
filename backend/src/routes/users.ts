import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';
import { generateAndFundAccount } from '../services/stellar';
import type { AuthRequest, Role } from '../types';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'REVIEWER', 'STUDENT']),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'REVIEWER', 'STUDENT']),
});

// GET /api/users — lista todos los usuarios (solo ADMIN)
router.get('/', authenticate, requireRole('ADMIN'), async (_req, res: Response) => {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      stellarPublicKey: users.stellarPublicKey,
      createdAt: users.createdAt,
    })
    .from(users);

  res.json({ data: allUsers });
});

// POST /api/users — crea un reviewer o admin (solo ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, password, role } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    res.status(409).json({ error: 'El correo ya está registrado' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { publicKey, encryptedSecret } = await generateAndFundAccount();

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: role as Role,
        stellarPublicKey: publicKey,
        encryptedStellarSecret: encryptedSecret,
      })
      .returning();

    if (!newUser) {
      res.status(500).json({ error: 'Error al crear el usuario' });
      return;
    }

    res.status(201).json({
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        stellarPublicKey: newUser.stellarPublicKey,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/users/:id — detalle de un usuario (solo ADMIN)
router.get('/:id', authenticate, requireRole('ADMIN'), async (req, res: Response) => {
  const userId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      stellarPublicKey: users.stellarPublicKey,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json({ data: user });
});

// PATCH /api/users/:id/role — cambia el rol de un usuario (solo ADMIN)
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  if (userId === req.user!.id) {
    res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    return;
  }

  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  await db.update(users).set({ role: parsed.data.role }).where(eq(users.id, userId));

  res.json({ message: `Rol actualizado a ${parsed.data.role}` });
});

export default router;
