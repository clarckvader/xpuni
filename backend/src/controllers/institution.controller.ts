import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { InstitutionService } from '../services/institution.service';
import type { AuthRequest } from '../types';

const CATEGORIES = ['general', 'food', 'retail', 'services', 'education', 'health', 'entertainment'] as const;

const createSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
});

export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {
    this.list = this.list.bind(this);
    this.findBySlug = this.findBySlug.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.deactivate = this.deactivate.bind(this);
  }

  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const institutions = await this.institutionService.list();
      res.json({ data: institutions });
    } catch (err) {
      next(err);
    }
  }

  async findBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      if (!slug) { res.status(400).json({ error: 'Slug requerido' }); return; }
      const inst = await this.institutionService.findBySlug(slug);
      res.json({ data: inst });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const inst = await this.institutionService.create(parsed.data);
      res.status(201).json({ data: inst });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const inst = await this.institutionService.update(id, parsed.data);
      res.json({ data: inst });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const result = await this.institutionService.deactivate(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
