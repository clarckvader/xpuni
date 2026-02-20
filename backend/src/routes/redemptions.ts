import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { redemptions, rewards, users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';
import { getBalance, burnPoints } from '../services/stellar';
import { recordRedemption } from '../services/redemptions';
import { config } from '../config';
import type { AuthRequest } from '../types';

const router = Router();

const createRedemptionSchema = z.object({
  rewardId: z.number().int().positive('El ID de recompensa es requerido'),
});

const completeSchema = z.object({
  notes: z.string().optional(),
});

// POST /api/redemptions — el estudiante canjea puntos por una recompensa
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  async (req: AuthRequest, res: Response) => {
    const parsed = createRedemptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message });
      return;
    }

    const { rewardId } = parsed.data;

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, rewardId), eq(rewards.status, 'ACTIVE')));

    if (!reward) {
      res.status(404).json({ error: 'Recompensa no encontrada o inactiva' });
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      res.status(400).json({ error: 'La recompensa está agotada' });
      return;
    }

    const [student] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (!student) {
      res.status(404).json({ error: 'Estudiante no encontrado' });
      return;
    }

    let currentBalance = 0n;
    try {
      currentBalance = await getBalance(student.stellarPublicKey);
    } catch (err) {
      console.warn('Error al obtener saldo on-chain:', err);
      res.status(503).json({ error: 'No se pudo verificar el saldo. Intenta más tarde.' });
      return;
    }

    if (currentBalance < BigInt(reward.pointsCost)) {
      res.status(400).json({
        error: `Saldo insuficiente. Tienes ${currentBalance} puntos, necesitas ${reward.pointsCost}`,
      });
      return;
    }

    let txHash: string | null = null;
    try {
      txHash = await burnPoints(student.stellarPublicKey, reward.pointsCost);
    } catch (err) {
      console.error('Error al quemar puntos:', err);
      res.status(503).json({
        error: 'Error al procesar el canje en la blockchain. Intenta más tarde.',
      });
      return;
    }

    // ── Registrar canje on-chain (redemption_records contract) ───────────────
    let redemptionTxHash: string | null = null;
    if (config.stellar.redemptionContractId) {
      try {
        redemptionTxHash = await recordRedemption(
          student.stellarPublicKey,
          reward.name,
          reward.pointsCost,
        );
      } catch (err) {
        console.error('Error al registrar canje on-chain:', err);
        console.warn('El registro on-chain falló. Revisa STELLAR_REDEMPTION_CONTRACT_ID.');
      }
    }

    if (reward.stock !== null) {
      await db
        .update(rewards)
        .set({ stock: reward.stock - 1 })
        .where(eq(rewards.id, rewardId));
    }

    const [newRedemption] = await db
      .insert(redemptions)
      .values({
        studentId: req.user!.id,
        rewardId,
        pointsSpent: reward.pointsCost,
        status: 'PENDING',
        txHash,
        redemptionTxHash,
      })
      .returning();

    const burnMsg = `${reward.pointsCost} puntos descontados (tx: ${txHash}).`;
    const recordMsg = redemptionTxHash
      ? ` Canje registrado on-chain (tx: ${redemptionTxHash}).`
      : config.stellar.redemptionContractId
        ? ' Registro on-chain falló (ver logs).'
        : '';

    res.status(201).json({
      data: newRedemption,
      message: `Canje registrado. ${burnMsg}${recordMsg} Un administrador procesará tu recompensa.`,
    });
  },
);

// GET /api/redemptions — lista canjes
// ADMIN/REVIEWER: todos | STUDENT: solo los propios
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const isStudent = req.user!.role === 'STUDENT';

  const baseQuery = db
    .select({
      id: redemptions.id,
      pointsSpent: redemptions.pointsSpent,
      status: redemptions.status,
      txHash: redemptions.txHash,
      notes: redemptions.notes,
      redeemedAt: redemptions.redeemedAt,
      completedAt: redemptions.completedAt,
      student: { id: users.id, email: users.email },
      reward: {
        id: rewards.id,
        name: rewards.name,
        rewardType: rewards.rewardType,
      },
    })
    .from(redemptions)
    .leftJoin(users, eq(redemptions.studentId, users.id))
    .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
    .orderBy(desc(redemptions.redeemedAt));

  const result = isStudent
    ? await baseQuery.where(eq(redemptions.studentId, req.user!.id))
    : await baseQuery;

  res.json({ data: result });
});

// GET /api/redemptions/:id — detalle de un canje
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const redemptionId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(redemptionId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const [redemption] = await db
    .select()
    .from(redemptions)
    .where(eq(redemptions.id, redemptionId));

  if (!redemption) {
    res.status(404).json({ error: 'Canje no encontrado' });
    return;
  }

  if (req.user!.role === 'STUDENT' && redemption.studentId !== req.user!.id) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  res.json({ data: redemption });
});

// PATCH /api/redemptions/:id/complete — marca el canje como entregado (solo ADMIN)
router.patch(
  '/:id/complete',
  authenticate,
  requireRole('ADMIN'),
  async (req, res: Response) => {
    const redemptionId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(redemptionId)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message });
      return;
    }

    const [redemption] = await db
      .select()
      .from(redemptions)
      .where(eq(redemptions.id, redemptionId));

    if (!redemption) {
      res.status(404).json({ error: 'Canje no encontrado' });
      return;
    }
    if (redemption.status !== 'PENDING') {
      res.status(400).json({ error: 'Solo se pueden completar canjes en estado PENDING' });
      return;
    }

    const now = new Date().toISOString();
    await db
      .update(redemptions)
      .set({
        status: 'COMPLETED',
        notes: parsed.data.notes ?? null,
        completedAt: now,
      })
      .where(eq(redemptions.id, redemptionId));

    const [updated] = await db
      .select()
      .from(redemptions)
      .where(eq(redemptions.id, redemptionId));

    res.json({ data: updated, message: 'Recompensa marcada como entregada' });
  },
);

export default router;
