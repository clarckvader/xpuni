import { RedemptionRepository } from '../repositories/redemption.repository';
import { RewardRepository } from '../repositories/reward.repository';
import { UserRepository } from '../repositories/user.repository';
import { StellarService } from './stellar.service';
import { BadRequestError, ForbiddenError, NotFoundError, ServiceUnavailableError } from '../errors';
import type { AppConfig } from '../config';

export class RedemptionService {
  constructor(
    private readonly redemptionRepo: RedemptionRepository,
    private readonly rewardRepo: RewardRepository,
    private readonly userRepo: UserRepository,
    private readonly stellarService: StellarService,
    private readonly config: AppConfig,
  ) {}

  async create(studentId: number, rewardId: number) {
    const reward = await this.rewardRepo.findActiveById(rewardId);
    if (!reward) throw new NotFoundError('Recompensa no encontrada o inactiva');
    if (reward.stock !== null && reward.stock <= 0) {
      throw new BadRequestError('La recompensa está agotada');
    }

    const student = await this.userRepo.findById(studentId);
    if (!student) throw new NotFoundError('Estudiante no encontrado');

    let currentBalance = 0n;
    try {
      currentBalance = await this.stellarService.getBalance(student.stellarPublicKey);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new ServiceUnavailableError(`No se pudo verificar el saldo: ${detail}`);
    }

    if (currentBalance < BigInt(reward.pointsCost)) {
      throw new BadRequestError(
        `Saldo insuficiente. Tienes ${currentBalance} créditos, necesitas ${reward.pointsCost}`,
      );
    }

    let txHash: string | null = null;
    try {
      txHash = await this.stellarService.burnPoints(student.stellarPublicKey, reward.pointsCost);
    } catch (err) {
      console.error('Error al quemar puntos:', err);
      throw new ServiceUnavailableError(
        'Error al procesar el canje. Intenta más tarde.',
      );
    }

    let redemptionTxHash: string | null = null;
    if (this.config.stellar.redemptionContractId) {
      try {
        redemptionTxHash = await this.stellarService.recordRedemption(
          student.stellarPublicKey,
          reward.name,
          reward.pointsCost,
        );
      } catch (err) {
        console.error('Error al registrar canje on-chain:', err);
      }
    }

    if (reward.stock !== null) {
      await this.rewardRepo.decrementStock(rewardId);
    }

    const newRedemption = await this.redemptionRepo.create({
      studentId,
      rewardId,
      pointsSpent: reward.pointsCost,
      txHash,
      redemptionTxHash,
    });

    const burnMsg = `${reward.pointsCost} créditos descontados (tx: ${txHash}).`;
    const recordMsg = redemptionTxHash
      ? ` Canje registrado on-chain (tx: ${redemptionTxHash}).`
      : '';

    return {
      data: newRedemption,
      message: `Canje registrado. ${burnMsg}${recordMsg} Un administrador procesará tu recompensa.`,
    };
  }

  async list(role: string, userId: number, status?: string) {
    const opts =
      role === 'STUDENT'
        ? { studentId: userId, status }
        : { status };

    const rows = await this.redemptionRepo.findMany(opts);
    return rows.map((r) => ({
      id: r.id,
      pointsSpent: r.pointsSpent,
      status: r.status,
      txHash: r.txHash,
      redemptionTxHash: r.redemptionTxHash,
      notes: r.notes,
      redeemedAt: r.redeemedAt,
      completedAt: r.completedAt,
      student: r.student ?? null,
      reward: r.reward ?? null,
    }));
  }

  async findById(id: number, role: string, userId: number) {
    const redemption = await this.redemptionRepo.findById(id);
    if (!redemption) throw new NotFoundError('Canje no encontrado');
    if (role === 'STUDENT' && redemption.studentId !== userId) {
      throw new ForbiddenError('Acceso denegado');
    }
    return redemption;
  }

  async complete(id: number, notes?: string) {
    const redemption = await this.redemptionRepo.findById(id);
    if (!redemption) throw new NotFoundError('Canje no encontrado');
    if (redemption.status !== 'PENDING') {
      throw new BadRequestError('Solo se pueden completar canjes en estado PENDING');
    }

    const updated = await this.redemptionRepo.complete(id, notes);
    return { data: updated, message: 'Recompensa marcada como entregada' };
  }
}
