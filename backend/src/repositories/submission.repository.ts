import { PrismaClient } from '@prisma/client';

export class SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countByStudentAndActivity(studentId: number, activityId: number): Promise<number> {
    return this.prisma.proofSubmission.count({ where: { studentId, activityId } });
  }

  async create(data: {
    studentId: number;
    activityId: number;
    description: string;
    fileUrl?: string | null;
  }) {
    return this.prisma.proofSubmission.create({ data: { ...data, status: 'PENDING' } });
  }

  async findMany(opts: { role: string; userId: number; status?: string }) {
    const where: Record<string, unknown> = {};
    if (opts.role === 'STUDENT') where['studentId'] = opts.userId;
    if (opts.status) where['status'] = opts.status;

    return this.prisma.proofSubmission.findMany({
      where,
      include: {
        student: { select: { id: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.proofSubmission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, email: true } },
      },
    });
  }

  async updateApproval(
    id: number,
    data: {
      reviewerId: number;
      reviewerNotes: string | null;
      txHash: string | null;
      badgeTxHash: string | null;
      reviewedAt: string;
    },
  ) {
    return this.prisma.proofSubmission.update({
      where: { id },
      data: { ...data, status: 'APPROVED' },
    });
  }

  async updateRejection(
    id: number,
    data: {
      reviewerId: number;
      reviewerNotes: string;
      reviewedAt: string;
    },
  ) {
    return this.prisma.proofSubmission.update({
      where: { id },
      data: { ...data, status: 'REJECTED' },
    });
  }
}
