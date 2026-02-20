import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { rewards, users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';
import { upload, buildFileUrl } from '../middleware/upload';
import type { AuthRequest } from '../types';

const router = Router();

const createRewardSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  pointsCost: z.number().int().positive('El costo en puntos debe ser positivo'),
  rewardType: z.enum(['PHYSICAL', 'GRADE_BONUS']),
  stock: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

const updateRewardSchema = createRewardSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const rewardSelect = {
  rewardId: rewards.id,
  name: rewards.name,
  description: rewards.description,
  pointsCost: rewards.pointsCost,
  rewardType: rewards.rewardType,
  stock: rewards.stock,
  imageUrl: rewards.imageUrl,
  status: rewards.status,
  createdAt: rewards.createdAt,
  createdByUserId: users.id,
  createdByEmail: users.email,
};

function mapReward(r: Record<string, unknown>) {
  return {
    id: r['rewardId'],
    name: r['name'],
    description: r['description'],
    pointsCost: r['pointsCost'],
    rewardType: r['rewardType'],
    stock: r['stock'],
    imageUrl: r['imageUrl'],
    status: r['status'],
    createdAt: r['createdAt'],
    createdBy: r['createdByUserId'] ? { id: r['createdByUserId'], email: r['createdByEmail'] } : null,
  };
}

// GET /api/rewards — lista recompensas
// STUDENT: solo ACTIVE | ADMIN/REVIEWER: todas
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const isStudent = req.user!.role === 'STUDENT';

  const baseQuery = db
    .select(rewardSelect)
    .from(rewards)
    .leftJoin(users, eq(rewards.createdBy, users.id))
    .orderBy(desc(rewards.createdAt));

  const rows = isStudent
    ? await baseQuery.where(eq(rewards.status, 'ACTIVE'))
    : await baseQuery;

  res.json({ data: rows.map(mapReward) });
});

// GET /api/rewards/:id — detalle de una recompensa
router.get('/:id', authenticate, async (req, res: Response) => {
  const rewardId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(rewardId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [row] = await db
    .select(rewardSelect)
    .from(rewards)
    .leftJoin(users, eq(rewards.createdBy, users.id))
    .where(eq(rewards.id, rewardId));

  if (!row) {
    res.status(404).json({ error: 'Recompensa no encontrada' });
    return;
  }

  res.json({ data: mapReward(row) });
});

// POST /api/rewards — crea una recompensa (solo ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = createRewardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { name, description, pointsCost, rewardType, stock, imageUrl } = parsed.data;

  const [newReward] = await db
    .insert(rewards)
    .values({
      name,
      description,
      pointsCost,
      rewardType,
      stock: stock ?? null,
      imageUrl: imageUrl ?? null,
      createdBy: req.user!.id,
      status: 'ACTIVE',
    })
    .returning();

  res.status(201).json({ data: newReward });
});

// PATCH /api/rewards/:id — edita una recompensa (solo ADMIN)
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res: Response) => {
  const rewardId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(rewardId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const parsed = updateRewardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const [existing] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
  if (!existing) {
    res.status(404).json({ error: 'Recompensa no encontrada' });
    return;
  }

  await db.update(rewards).set(parsed.data).where(eq(rewards.id, rewardId));

  const [updated] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
  res.json({ data: updated });
});

// DELETE /api/rewards/:id — desactiva una recompensa (solo ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res: Response) => {
  const rewardId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(rewardId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [existing] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
  if (!existing) {
    res.status(404).json({ error: 'Recompensa no encontrada' });
    return;
  }

  await db.update(rewards).set({ status: 'INACTIVE' }).where(eq(rewards.id, rewardId));

  res.json({ message: 'Recompensa desactivada correctamente' });
});

// POST /api/rewards/:id/image — sube imagen de la recompensa (solo ADMIN)
router.post(
  '/:id/image',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),
  async (req, res: Response) => {
    const rewardId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(rewardId)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Se requiere un archivo de imagen' });
      return;
    }

    const [existing] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!existing) {
      res.status(404).json({ error: 'Recompensa no encontrada' });
      return;
    }

    const imageUrl = buildFileUrl(req.file.filename);

    await db.update(rewards).set({ imageUrl }).where(eq(rewards.id, rewardId));

    const [updated] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    res.json({ data: updated, message: `Imagen actualizada: ${imageUrl}` });
  },
);

export default router;
