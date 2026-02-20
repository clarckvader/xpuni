import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { activities, users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';
import { upload, buildFileUrl } from '../middleware/upload';
import type { AuthRequest } from '../types';

const router = Router();

const createActivitySchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  pointsReward: z.number().int().positive('Los puntos deben ser un número positivo'),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
  maxSubmissions: z.number().int().positive().optional().nullable(),
  badgeImageUrl: z.string().url().optional().nullable(),
});

const updateActivitySchema = createActivitySchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const activitySelect = {
  id: activities.id,
  title: activities.title,
  description: activities.description,
  pointsReward: activities.pointsReward,
  deadline: activities.deadline,
  maxSubmissions: activities.maxSubmissions,
  status: activities.status,
  badgeImageUrl: activities.badgeImageUrl,
  createdAt: activities.createdAt,
  createdBy: { id: users.id, email: users.email },
};

// GET /api/activities — lista actividades (ACTIVE por defecto para estudiantes)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const showAll = req.user?.role !== 'STUDENT';

  const baseQuery = db
    .select(activitySelect)
    .from(activities)
    .leftJoin(users, eq(activities.createdBy, users.id))
    .orderBy(desc(activities.createdAt));

  const result = showAll
    ? await baseQuery
    : await baseQuery.where(eq(activities.status, 'ACTIVE'));

  res.json({ data: result });
});

// GET /api/activities/:id — detalle de una actividad
router.get('/:id', authenticate, async (req, res: Response) => {
  const activityId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(activityId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [activity] = await db
    .select(activitySelect)
    .from(activities)
    .leftJoin(users, eq(activities.createdBy, users.id))
    .where(eq(activities.id, activityId));

  if (!activity) {
    res.status(404).json({ error: 'Actividad no encontrada' });
    return;
  }

  res.json({ data: activity });
});

// POST /api/activities — crea una actividad (solo ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = createActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { title, description, pointsReward, deadline, maxSubmissions, badgeImageUrl } = parsed.data;

  const [newActivity] = await db
    .insert(activities)
    .values({
      title,
      description,
      pointsReward,
      deadline: deadline ?? null,
      maxSubmissions: maxSubmissions ?? null,
      badgeImageUrl: badgeImageUrl ?? null,
      createdBy: req.user!.id,
      status: 'ACTIVE',
    })
    .returning();

  res.status(201).json({ data: newActivity });
});

// PATCH /api/activities/:id — edita una actividad (solo ADMIN)
router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res: Response) => {
  const activityId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(activityId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const parsed = updateActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const [existing] = await db.select().from(activities).where(eq(activities.id, activityId));
  if (!existing) {
    res.status(404).json({ error: 'Actividad no encontrada' });
    return;
  }

  await db.update(activities).set(parsed.data).where(eq(activities.id, activityId));

  const [updated] = await db.select().from(activities).where(eq(activities.id, activityId));
  res.json({ data: updated });
});

// POST /api/activities/:id/badge-image — sube imagen del badge (solo ADMIN)
router.post(
  '/:id/badge-image',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),
  async (req, res: Response) => {
    const activityId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(activityId)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Se requiere un archivo de imagen' });
      return;
    }

    const [existing] = await db.select().from(activities).where(eq(activities.id, activityId));
    if (!existing) {
      res.status(404).json({ error: 'Actividad no encontrada' });
      return;
    }

    const badgeImageUrl = buildFileUrl(req.file.filename);

    await db.update(activities).set({ badgeImageUrl }).where(eq(activities.id, activityId));

    const [updated] = await db.select().from(activities).where(eq(activities.id, activityId));
    res.json({ data: updated, message: `Imagen del badge actualizada: ${badgeImageUrl}` });
  },
);

// DELETE /api/activities/:id — desactiva una actividad (solo ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res: Response) => {
  const activityId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(activityId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [existing] = await db.select().from(activities).where(eq(activities.id, activityId));
  if (!existing) {
    res.status(404).json({ error: 'Actividad no encontrada' });
    return;
  }

  await db.update(activities).set({ status: 'INACTIVE' }).where(eq(activities.id, activityId));

  res.json({ message: 'Actividad desactivada correctamente' });
});

export default router;
