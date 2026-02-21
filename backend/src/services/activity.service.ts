import { ActivityRepository } from '../repositories/activity.repository';
import { buildFileUrl } from '../middleware/upload';
import { NotFoundError } from '../errors';

export class ActivityService {
  constructor(private readonly activityRepo: ActivityRepository) {}

  async list(isStudent: boolean) {
    const rows = await this.activityRepo.findAll(isStudent);
    return rows.map(this.mapActivity);
  }

  async findById(id: number) {
    const row = await this.activityRepo.findById(id);
    if (!row) throw new NotFoundError('Actividad no encontrada');
    return this.mapActivity(row);
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
    return this.activityRepo.create(data);
  }

  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      pointsReward: number;
      deadline: string | null;
      maxSubmissions: number | null;
      badgeImageUrl: string | null;
      status: string;
    }>,
  ) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new NotFoundError('Actividad no encontrada');
    return this.activityRepo.update(id, data);
  }

  async uploadBadgeImage(id: number, filename: string) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new NotFoundError('Actividad no encontrada');
    const badgeImageUrl = buildFileUrl(filename);
    return this.activityRepo.updateBadgeImage(id, badgeImageUrl);
  }

  async deactivate(id: number) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new NotFoundError('Actividad no encontrada');
    await this.activityRepo.deactivate(id);
  }

  private mapActivity(row: {
    id: number;
    title: string;
    description: string;
    pointsReward: number;
    deadline: string | null;
    maxSubmissions: number | null;
    status: string;
    badgeImageUrl: string | null;
    createdAt: string;
    creator: { id: number; email: string } | null;
  }) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      pointsReward: row.pointsReward,
      deadline: row.deadline,
      maxSubmissions: row.maxSubmissions,
      status: row.status,
      badgeImageUrl: row.badgeImageUrl,
      createdAt: row.createdAt,
      createdBy: row.creator ?? null,
    };
  }
}
