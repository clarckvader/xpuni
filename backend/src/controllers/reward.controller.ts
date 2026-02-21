import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { RewardService } from '../services/reward.service';
import { BadRequestError } from '../errors';
import type { AuthRequest } from '../types';

const createRewardSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  pointsCost: z.number().int().positive('El costo en puntos debe ser positivo'),
  rewardType: z.enum(['PHYSICAL', 'GRADE_BONUS']),
  stock: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

const updateRewardSchema = createRewardSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export class RewardController {
  constructor(private readonly rewardService: RewardService) {
    this.list = this.list.bind(this);
    this.findById = this.findById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.deactivate = this.deactivate.bind(this);
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isStudent = req.user!.role === 'STUDENT';
      const rewards = await this.rewardService.list(isStudent);
      res.json({ data: rewards });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const reward = await this.rewardService.findById(id);
      res.json({ data: reward });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const reward = await this.rewardService.create({
        ...parsed.data,
        createdBy: req.user!.id,
      });
      res.status(201).json({ data: reward });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = updateRewardSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const reward = await this.rewardService.update(id, parsed.data);
      res.json({ data: reward });
    } catch (err) {
      next(err);
    }
  }

  async uploadImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      if (!req.file) throw new BadRequestError('Se requiere un archivo de imagen');
      const updated = await this.rewardService.uploadImage(id, req.file.filename);
      res.json({ data: updated, message: `Imagen actualizada: ${updated.imageUrl}` });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      await this.rewardService.deactivate(id);
      res.json({ message: 'Recompensa desactivada correctamente' });
    } catch (err) {
      next(err);
    }
  }
}
