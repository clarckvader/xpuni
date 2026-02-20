import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate, generateToken } from '../middleware/auth';
import { generateAndFundAccount, getBalance } from '../services/stellar';
import type { AuthRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register — registro de estudiante
router.post('/register', async (req, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, password } = parsed.data;

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
        role: 'STUDENT',
        stellarPublicKey: publicKey,
        encryptedStellarSecret: encryptedSecret,
      })
      .returning();

    if (!newUser) {
      res.status(500).json({ error: 'Error al crear el usuario' });
      return;
    }

    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    res.status(201).json({
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          stellarPublicKey: newUser.stellarPublicKey,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login — inicio de sesión
router.post('/login', async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciales incorrectas' });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        stellarPublicKey: user.stellarPublicKey,
        createdAt: user.createdAt,
      },
    },
  });
});

// GET /api/auth/me — perfil del usuario autenticado + saldo on-chain
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  let onChainBalance = 0n;
  try {
    onChainBalance = await getBalance(user.stellarPublicKey);
  } catch (err) {
    console.warn('No se pudo obtener el saldo on-chain:', err);
  }

  res.json({
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      stellarPublicKey: user.stellarPublicKey,
      pointsBalance: onChainBalance.toString(),
      createdAt: user.createdAt,
    },
  });
});

export default router;
