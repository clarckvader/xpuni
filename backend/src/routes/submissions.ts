import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { proofSubmissions, activities, users } from '../db/schema';
import { authenticate, requireRole } from '../middleware/auth';
import { upload, buildFileUrl } from '../middleware/upload';
import { mintPoints } from '../services/stellar';
import { issueBadge, computeDescriptionHash } from '../services/badges';
import { config } from '../config';
import type { AuthRequest } from '../types';

const router = Router();

const rejectSchema = z.object({
  notes: z.string().min(1, 'Las notas de rechazo son requeridas'),
});

const approveSchema = z.object({
  notes: z.string().optional(),
});

// POST /api/submissions — el estudiante sube una prueba con archivo adjunto
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const activityId = parseInt(req.body?.activity_id, 10);
    const description = req.body?.description as string | undefined;

    if (isNaN(activityId)) {
      res.status(400).json({ error: 'activity_id requerido y debe ser un número' });
      return;
    }
    if (!description?.trim()) {
      res.status(400).json({ error: 'La descripción es requerida' });
      return;
    }

    const [activity] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.id, activityId), eq(activities.status, 'ACTIVE')));

    if (!activity) {
      res.status(404).json({ error: 'Actividad no encontrada o inactiva' });
      return;
    }

    if (activity.deadline && new Date(activity.deadline) < new Date()) {
      res.status(400).json({ error: 'La actividad ya venció (deadline expirado)' });
      return;
    }

    if (activity.maxSubmissions) {
      const existingRows = await db
        .select()
        .from(proofSubmissions)
        .where(
          and(
            eq(proofSubmissions.studentId, req.user!.id),
            eq(proofSubmissions.activityId, activityId),
          ),
        );

      if (existingRows.length >= activity.maxSubmissions) {
        res.status(400).json({
          error: `Ya alcanzaste el máximo de ${activity.maxSubmissions} envío(s) para esta actividad`,
        });
        return;
      }
    }

    const fileUrl = req.file ? buildFileUrl(req.file.filename) : undefined;

    const [submission] = await db
      .insert(proofSubmissions)
      .values({
        studentId: req.user!.id,
        activityId,
        description: description.trim(),
        fileUrl: fileUrl ?? null,
        status: 'PENDING',
      })
      .returning();

    res.status(201).json({ data: submission });
  },
);

// GET /api/submissions — lista pruebas
// ADMIN/REVIEWER: todas | STUDENT: solo las propias
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const isStudent = req.user!.role === 'STUDENT';
  const statusParam = req.query['status'] as string | undefined;

  // Note: use flat column aliases (not nested objects) to avoid duplicate 'id'
  // column names when Node's native sqlite collapses object keys.
  const baseQuery = db
    .select({
      submissionId: proofSubmissions.id,
      description: proofSubmissions.description,
      fileUrl: proofSubmissions.fileUrl,
      status: proofSubmissions.status,
      reviewerNotes: proofSubmissions.reviewerNotes,
      txHash: proofSubmissions.txHash,
      badgeTxHash: proofSubmissions.badgeTxHash,
      submittedAt: proofSubmissions.submittedAt,
      reviewedAt: proofSubmissions.reviewedAt,
      studentUserId: users.id,
      studentEmail: users.email,
      activityId: proofSubmissions.activityId,
    })
    .from(proofSubmissions)
    .leftJoin(users, eq(proofSubmissions.studentId, users.id))
    .orderBy(desc(proofSubmissions.submittedAt));

  const studentFilter = isStudent ? eq(proofSubmissions.studentId, req.user!.id) : undefined;
  const statusFilter = statusParam ? eq(proofSubmissions.status, statusParam as any) : undefined;

  let rows;
  if (studentFilter && statusFilter) {
    rows = await baseQuery.where(and(studentFilter, statusFilter));
  } else if (studentFilter) {
    rows = await baseQuery.where(studentFilter);
  } else if (statusFilter) {
    rows = await baseQuery.where(statusFilter);
  } else {
    rows = await baseQuery;
  }

  const result = rows.map(r => ({
    id: r.submissionId,
    description: r.description,
    fileUrl: r.fileUrl,
    status: r.status,
    reviewerNotes: r.reviewerNotes,
    txHash: r.txHash,
    badgeTxHash: r.badgeTxHash,
    submittedAt: r.submittedAt,
    reviewedAt: r.reviewedAt,
    student: r.studentUserId ? { id: r.studentUserId, email: r.studentEmail } : null,
    activityId: r.activityId,
  }));

  res.json({ data: result });
});

// GET /api/submissions/:id — detalle de una prueba
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const submissionId = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(submissionId)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  // Use flat column aliases to avoid 'id' column collision between tables
  const [row] = await db
    .select({
      submissionId: proofSubmissions.id,
      studentId: proofSubmissions.studentId,
      activityId: proofSubmissions.activityId,
      description: proofSubmissions.description,
      fileUrl: proofSubmissions.fileUrl,
      status: proofSubmissions.status,
      reviewerId: proofSubmissions.reviewerId,
      reviewerNotes: proofSubmissions.reviewerNotes,
      txHash: proofSubmissions.txHash,
      badgeTxHash: proofSubmissions.badgeTxHash,
      submittedAt: proofSubmissions.submittedAt,
      reviewedAt: proofSubmissions.reviewedAt,
      studentEmail: users.email,
    })
    .from(proofSubmissions)
    .leftJoin(users, eq(proofSubmissions.studentId, users.id))
    .where(eq(proofSubmissions.id, submissionId));

  const submission = row
    ? {
        id: row.submissionId,
        studentId: row.studentId,
        activityId: row.activityId,
        description: row.description,
        fileUrl: row.fileUrl,
        status: row.status,
        reviewerId: row.reviewerId,
        reviewerNotes: row.reviewerNotes,
        txHash: row.txHash,
        badgeTxHash: row.badgeTxHash,
        submittedAt: row.submittedAt,
        reviewedAt: row.reviewedAt,
        student: { id: row.studentId, email: row.studentEmail },
      }
    : undefined;

  if (!submission) {
    res.status(404).json({ error: 'Prueba no encontrada' });
    return;
  }

  if (req.user!.role === 'STUDENT' && submission.studentId !== req.user!.id) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  res.json({ data: submission });
});

// PATCH /api/submissions/:id/approve — aprueba la prueba y acuña puntos
router.patch(
  '/:id/approve',
  authenticate,
  requireRole('ADMIN', 'REVIEWER'),
  async (req: AuthRequest, res: Response) => {
    const submissionId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(submissionId)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message });
      return;
    }

    const [submission] = await db
      .select()
      .from(proofSubmissions)
      .where(eq(proofSubmissions.id, submissionId));

    if (!submission) {
      res.status(404).json({ error: 'Prueba no encontrada' });
      return;
    }
    if (submission.status !== 'PENDING') {
      res.status(400).json({
        error: `La prueba ya fue ${submission.status === 'APPROVED' ? 'aprobada' : 'rechazada'}`,
      });
      return;
    }

    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, submission.activityId));

    if (!activity) {
      res.status(404).json({ error: 'Actividad asociada no encontrada' });
      return;
    }

    const [student] = await db.select().from(users).where(eq(users.id, submission.studentId));
    if (!student) {
      res.status(404).json({ error: 'Estudiante no encontrado' });
      return;
    }

    // ── Acuñar puntos (school_points contract) ────────────────────────────────
    let txHash: string | null = null;
    try {
      txHash = await mintPoints(student.stellarPublicKey, activity.pointsReward);
    } catch (err) {
      console.error('Error al acuñar puntos:', err);
      console.warn('Los puntos no se acuñaron en la blockchain. Revisa la configuración de Stellar.');
    }

    // ── Emitir badge de logro (achievement_badges contract) ───────────────────
    let badgeTxHash: string | null = null;
    if (config.stellar.badgeContractId) {
      try {
        const descHash = computeDescriptionHash(submission.description);
        badgeTxHash = await issueBadge(
          student.stellarPublicKey,
          submission.activityId,
          activity.title,
          activity.badgeImageUrl ?? '',
          activity.pointsReward,
          descHash,
        );
      } catch (err) {
        console.error('Error al emitir badge de logro:', err);
        console.warn('El badge no se emitió. Revisa la configuración de STELLAR_BADGE_CONTRACT_ID.');
      }
    }

    const now = new Date().toISOString();
    await db
      .update(proofSubmissions)
      .set({
        status: 'APPROVED',
        reviewerId: req.user!.id,
        reviewerNotes: parsed.data.notes ?? null,
        txHash,
        badgeTxHash,
        reviewedAt: now,
      })
      .where(eq(proofSubmissions.id, submissionId));

    const [updated] = await db
      .select()
      .from(proofSubmissions)
      .where(eq(proofSubmissions.id, submissionId));

    const mintMsg = txHash
      ? `${activity.pointsReward} puntos acuñados (tx: ${txHash})`
      : 'Los puntos se acuñarán cuando el contrato esté configurado.';
    const badgeMsg = badgeTxHash
      ? ` Badge emitido on-chain (tx: ${badgeTxHash}).`
      : config.stellar.badgeContractId
        ? ' Badge no pudo emitirse (ver logs).'
        : ' Badge pendiente (STELLAR_BADGE_CONTRACT_ID no configurado).';

    res.json({
      data: updated,
      message: `Prueba aprobada. ${mintMsg}.${badgeMsg}`,
    });
  },
);

// PATCH /api/submissions/:id/reject — rechaza la prueba
router.patch(
  '/:id/reject',
  authenticate,
  requireRole('ADMIN', 'REVIEWER'),
  async (req: AuthRequest, res: Response) => {
    const submissionId = parseInt(req.params['id'] ?? '', 10);
    if (isNaN(submissionId)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const parsed = rejectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message });
      return;
    }

    const [submission] = await db
      .select()
      .from(proofSubmissions)
      .where(eq(proofSubmissions.id, submissionId));

    if (!submission) {
      res.status(404).json({ error: 'Prueba no encontrada' });
      return;
    }
    if (submission.status !== 'PENDING') {
      res.status(400).json({ error: 'Solo se pueden rechazar pruebas en estado PENDING' });
      return;
    }

    const now = new Date().toISOString();
    await db
      .update(proofSubmissions)
      .set({
        status: 'REJECTED',
        reviewerId: req.user!.id,
        reviewerNotes: parsed.data.notes,
        reviewedAt: now,
      })
      .where(eq(proofSubmissions.id, submissionId));

    const [updated] = await db
      .select()
      .from(proofSubmissions)
      .where(eq(proofSubmissions.id, submissionId));

    res.json({ data: updated, message: 'Prueba rechazada' });
  },
);

export default router;
