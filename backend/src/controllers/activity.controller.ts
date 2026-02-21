import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ActivityService } from '../services/activity.service';
import { BadRequestError } from '../errors';
import type { AuthRequest } from '../types';

const createActivitySchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  pointsReward: z.number().int().positive('Los puntos deben ser un número positivo'),
  deadline: z.string().datetime({ offset: true }).optional().nullable(),
  maxSubmissions: z.number().int().positive().optional().nullable(),
  badgeImageUrl: z.string().url().optional().nullable(),
});

const updateActivitySchema = createActivitySchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class ActivityController {
  constructor(private readonly activityService: ActivityService) {
    this.list = this.list.bind(this);
    this.findById = this.findById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.uploadBadgeImage = this.uploadBadgeImage.bind(this);
    this.deactivate = this.deactivate.bind(this);
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user!.role === 'STUDENT';
      const activities = await this.activityService.list(isStudent);
      res.json({ data: activities });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const activity = await this.activityService.findById(id);
      res.json({ data: activity });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const activity = await this.activityService.create({
        ...parsed.data,
        createdBy: req.user!.id,
      });
      res.status(201).json({ data: activity });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = updateActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const activity = await this.activityService.update(id, parsed.data);
      res.json({ data: activity });
    } catch (err) {
      next(err);
    }
  }

  async uploadBadgeImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      if (!req.file) throw new BadRequestError('Se requiere un archivo de imagen');
      const updated = await this.activityService.uploadBadgeImage(id, req.file.filename);
      res.json({ data: updated, message: `Imagen del badge actualizada: ${updated.badgeImageUrl}` });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      await this.activityService.deactivate(id);
      res.json({ message: 'Actividad desactivada correctamente' });
    } catch (err) {
      next(err);
    }
  }
}
