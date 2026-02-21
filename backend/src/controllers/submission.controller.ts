import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubmissionService } from '../services/submission.service';
import { BadRequestError } from '../errors';
import type { AuthRequest } from '../types';

const rejectSchema = z.object({
  notes: z.string().min(1, 'Las notas de rechazo son requeridas'),
});

const approveSchema = z.object({
  notes: z.string().optional(),
});

export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.findById = this.findById.bind(this);
    this.approve = this.approve.bind(this);
    this.reject = this.reject.bind(this);
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activityId = parseInt(req.body?.activity_id, 10);
      const description = req.body?.description as string | undefined;
      if (isNaN(activityId)) throw new BadRequestError('activity_id requerido y debe ser un número');
      if (!description?.trim()) throw new BadRequestError('La descripción es requerida');
      const submission = await this.submissionService.create(
        req.user!.id,
        activityId,
        description,
        req.file,
      );
      res.status(201).json({ data: submission });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query['status'] as string | undefined;
      const result = await this.submissionService.list(req.user!.role, req.user!.id, status);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const submission = await this.submissionService.findById(id, req.user!.role, req.user!.id);
      res.json({ data: submission });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = approveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const result = await this.submissionService.approve(id, req.user!.id, parsed.data.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const result = await this.submissionService.reject(id, req.user!.id, parsed.data.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
