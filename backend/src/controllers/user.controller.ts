import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import type { AuthRequest } from '../types';

const createUserSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'REVIEWER', 'STUDENT']),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'REVIEWER', 'STUDENT']),
});

export class UserController {
  constructor(private readonly userService: UserService) {
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.findById = this.findById.bind(this);
    this.delete = this.delete.bind(this);
    this.updateRole = this.updateRole.bind(this);
  }

  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.list();
      res.json({ data: users });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const user = await this.userService.create(
        parsed.data.email,
        parsed.data.password,
        parsed.data.role,
      );
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const user = await this.userService.findById(id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      await this.userService.delete(id, req.user!.id);
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      await this.userService.updateRole(id, parsed.data.role, req.user!.id);
      res.json({ message: `Rol actualizado a ${parsed.data.role}` });
    } catch (err) {
      next(err);
    }
  }
}
