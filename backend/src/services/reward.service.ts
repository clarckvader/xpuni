import { RewardRepository } from '../repositories/reward.repository';
import { buildFileUrl } from '../middleware/upload';
import { NotFoundError } from '../errors';

export class RewardService {
  constructor(private readonly rewardRepo: RewardRepository) {}

  async list(isStudent: boolean) {
    const rows = await this.rewardRepo.findAll(isStudent);
    return rows.map(this.mapReward);
  }

  async findById(id: number) {
    const row = await this.rewardRepo.findById(id);
    if (!row) throw new NotFoundError('Recompensa no encontrada');
    return this.mapReward(row);
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
    return this.rewardRepo.create(data);
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
    const existing = await this.rewardRepo.findById(id);
    if (!existing) throw new NotFoundError('Recompensa no encontrada');
    return this.rewardRepo.update(id, data);
  }

  async uploadImage(id: number, filename: string) {
    const existing = await this.rewardRepo.findById(id);
    if (!existing) throw new NotFoundError('Recompensa no encontrada');
    const imageUrl = buildFileUrl(filename);
    return this.rewardRepo.updateImage(id, imageUrl);
  }

  async deactivate(id: number) {
    const existing = await this.rewardRepo.findById(id);
    if (!existing) throw new NotFoundError('Recompensa no encontrada');
    await this.rewardRepo.deactivate(id);
  }

  private mapReward(row: {
    id: number;
    name: string;
    description: string;
    pointsCost: number;
    rewardType: string;
    stock: number | null;
    imageUrl: string | null;
    status: string;
    createdAt: string;
    creator: { id: number; email: string } | null;
  }) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      pointsCost: row.pointsCost,
      rewardType: row.rewardType,
      stock: row.stock,
      imageUrl: row.imageUrl,
      status: row.status,
      createdAt: row.createdAt,
      createdBy: row.creator ?? null,
    };
  }
}
