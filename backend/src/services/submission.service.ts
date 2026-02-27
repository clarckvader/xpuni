import { SubmissionRepository } from '../repositories/submission.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { UserRepository } from '../repositories/user.repository';
import { StellarService } from './stellar.service';
import { buildFileUrl } from '../middleware/upload';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors';
import type { AppConfig } from '../config';

export class SubmissionService {
  constructor(
    private readonly submissionRepo: SubmissionRepository,
    private readonly activityRepo: ActivityRepository,
    private readonly userRepo: UserRepository,
    private readonly stellarService: StellarService,
    private readonly config: AppConfig,
  ) {}

  async create(
    userId: number,
    activityId: number,
    description: string,
    file?: Express.Multer.File,
  ) {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity || activity.status !== 'ACTIVE') {
      throw new NotFoundError('Actividad no encontrada o inactiva');
    }

    if (activity.deadline && new Date(activity.deadline) < new Date()) {
      throw new BadRequestError('La actividad ya venció (deadline expirado)');
    }

    if (activity.maxSubmissions) {
      const count = await this.submissionRepo.countByStudentAndActivity(userId, activityId);
      if (count >= activity.maxSubmissions) {
        throw new BadRequestError(
          `Ya alcanzaste el máximo de ${activity.maxSubmissions} envío(s) para esta actividad`,
        );
      }
    }

    const fileUrl = file ? buildFileUrl(file.filename) : null;

    return this.submissionRepo.create({
      studentId: userId,
      activityId,
      description: description.trim(),
      fileUrl,
    });
  }

  async list(role: string, userId: number, status?: string) {
    const rows = await this.submissionRepo.findMany({ role, userId, status });
    return rows.map((r) => ({
      id: r.id,
      description: r.description,
      fileUrl: r.fileUrl,
      status: r.status,
      reviewerNotes: r.reviewerNotes,
      txHash: r.txHash,
      badgeTxHash: r.badgeTxHash,
      submittedAt: r.submittedAt,
      reviewedAt: r.reviewedAt,
      student: r.student ?? null,
      activityId: r.activityId,
    }));
  }

  async findById(id: number, role: string, userId: number) {
    const row = await this.submissionRepo.findById(id);
    if (!row) throw new NotFoundError('Prueba no encontrada');
    if (role === 'STUDENT' && row.studentId !== userId) throw new ForbiddenError('Acceso denegado');

    return {
      id: row.id,
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
      student: row.student ?? null,
    };
  }

  async approve(id: number, reviewerId: number, notes?: string) {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundError('Prueba no encontrada');
    if (submission.status !== 'PENDING') {
      const state = submission.status === 'APPROVED' ? 'aprobada' : 'rechazada';
      throw new BadRequestError(`La prueba ya fue ${state}`);
    }

    const activity = await this.activityRepo.findById(submission.activityId);
    if (!activity) throw new NotFoundError('Actividad asociada no encontrada');

    const student = await this.userRepo.findById(submission.studentId);
    if (!student) throw new NotFoundError('Estudiante no encontrado');

    let txHash: string | null = null;
    let mintError: string | null = null;
    try {
      txHash = await this.stellarService.mintPoints(student.stellarPublicKey, activity.pointsReward);
    } catch (err) {
      mintError = err instanceof Error ? err.message : String(err);
      console.error('Error al acuñar puntos:', err);
    }

    let badgeTxHash: string | null = null;
    let badgeError: string | null = null;
    if (this.config.stellar.badgeContractId) {
      try {
        const descHash = this.stellarService.computeDescriptionHash(submission.description);
        badgeTxHash = await this.stellarService.issueBadge(
          student.stellarPublicKey,
          submission.activityId,
          activity.title,
          activity.badgeImageUrl ?? '',
          activity.pointsReward,
          descHash,
        );
      } catch (err) {
        badgeError = err instanceof Error ? err.message : String(err);
        console.error('Error al emitir badge de logro:', err);
      }
    }

    const now = new Date().toISOString();
    const updated = await this.submissionRepo.updateApproval(id, {
      reviewerId,
      reviewerNotes: notes ?? null,
      txHash,
      badgeTxHash,
      reviewedAt: now,
    });

    const mintMsg = txHash
      ? `${activity.pointsReward} puntos acuñados (tx: ${txHash})`
      : mintError
        ? `Mint falló: ${mintError}`
        : 'STELLAR_CONTRACT_ID no configurado — puntos no acuñados.';
    const badgeMsg = badgeTxHash
      ? ` Badge emitido on-chain (tx: ${badgeTxHash}).`
      : badgeError
        ? ` Badge falló: ${badgeError}`
        : this.config.stellar.badgeContractId
          ? ''
          : ' STELLAR_BADGE_CONTRACT_ID no configurado.';

    return { data: updated, message: `Prueba aprobada. ${mintMsg}.${badgeMsg}` };
  }

  async reject(id: number, reviewerId: number, notes: string) {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundError('Prueba no encontrada');
    if (submission.status !== 'PENDING') {
      throw new BadRequestError('Solo se pueden rechazar pruebas en estado PENDING');
    }

    const now = new Date().toISOString();
    const updated = await this.submissionRepo.updateRejection(id, {
      reviewerId,
      reviewerNotes: notes,
      reviewedAt: now,
    });

    return { data: updated, message: 'Prueba rechazada' };
  }
}
