import { PrismaClient } from '@prisma/client';

export class RedemptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    studentId: number;
    rewardId: number;
    pointsSpent: number;
    txHash: string | null;
    redemptionTxHash: string | null;
  }) {
    return this.prisma.redemption.create({ data: { ...data, status: 'PENDING' } });
  }

  async findMany(opts: { studentId?: number; status?: string }) {
    const where: Record<string, unknown> = {};
    if (opts.studentId !== undefined) where['studentId'] = opts.studentId;
    if (opts.status) where['status'] = opts.status;

    return this.prisma.redemption.findMany({
      where,
      include: {
        student: { select: { id: true, email: true } },
        reward: { select: { id: true, name: true, rewardType: true } },
      },
      orderBy: { redeemedAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.redemption.findUnique({ where: { id } });
  }

  async complete(id: number, notes?: string | null) {
    return this.prisma.redemption.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        notes: notes ?? null,
        completedAt: new Date().toISOString(),
      },
    });
  }
}
