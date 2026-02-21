import { PrismaClient } from '@prisma/client';

export class RewardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(isStudent: boolean) {
    return this.prisma.reward.findMany({
      where: isStudent ? { status: 'ACTIVE' } : undefined,
      include: {
        creator: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.reward.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true } },
      },
    });
  }

  async findActiveById(id: number) {
    return this.prisma.reward.findFirst({ where: { id, status: 'ACTIVE' } });
  }

  async create(data: {
    name: string;
    description: string;
    pointsCost: number;
    rewardType: string;
    stock?: number | null;
    imageUrl?: string | null;
    createdBy: number;
  }) {
    return this.prisma.reward.create({ data: { ...data, status: 'ACTIVE' } });
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      pointsCost: number;
      rewardType: string;
      stock: number | null;
      imageUrl: string | null;
      status: string;
    }>,
  ) {
    return this.prisma.reward.update({ where: { id }, data });
  }

  async updateImage(id: number, imageUrl: string) {
    return this.prisma.reward.update({ where: { id }, data: { imageUrl } });
  }

  async deactivate(id: number) {
    await this.prisma.reward.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  async decrementStock(id: number) {
    await this.prisma.reward.update({
      where: { id },
      data: { stock: { decrement: 1 } },
    });
  }
}
