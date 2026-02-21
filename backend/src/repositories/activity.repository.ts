import { PrismaClient } from '@prisma/client';

export class ActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(isStudent: boolean) {
    return this.prisma.activity.findMany({
      where: isStudent ? { status: 'ACTIVE' } : undefined,
      include: {
        creator: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.activity.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true } },
      },
    });
  }

  async create(data: {
    title: string;
    description: string;
    pointsReward: number;
    deadline?: string | null;
    maxSubmissions?: number | null;
    badgeImageUrl?: string | null;
    createdBy: number;
  }) {
    return this.prisma.activity.create({ data: { ...data, status: 'ACTIVE' } });
  }

  async update(id: number, data: Partial<{
    title: string;
    description: string;
    pointsReward: number;
    deadline: string | null;
    maxSubmissions: number | null;
    badgeImageUrl: string | null;
    status: string;
  }>) {
    return this.prisma.activity.update({ where: { id }, data });
  }

  async updateBadgeImage(id: number, badgeImageUrl: string) {
    return this.prisma.activity.update({ where: { id }, data: { badgeImageUrl } });
  }

  async deactivate(id: number) {
    await this.prisma.activity.update({ where: { id }, data: { status: 'INACTIVE' } });
  }
}
