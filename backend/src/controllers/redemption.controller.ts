import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { RedemptionService } from '../services/redemption.service';
import type { AuthRequest } from '../types';

const createRedemptionSchema = z.object({
  rewardId: z.number().int().positive('El ID de recompensa es requerido'),
});

const completeSchema = z.object({
  notes: z.string().optional(),
});

export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.findById = this.findById.bind(this);
    this.complete = this.complete.bind(this);
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createRedemptionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const result = await this.redemptionService.create(req.user!.id, parsed.data.rewardId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query['status'] as string | undefined;
      const result = await this.redemptionService.list(req.user!.role, req.user!.id, status);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const redemption = await this.redemptionService.findById(id, req.user!.role, req.user!.id);
      res.json({ data: redemption });
    } catch (err) {
      next(err);
    }
  }

  async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = completeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const result = await this.redemptionService.complete(id, parsed.data.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
