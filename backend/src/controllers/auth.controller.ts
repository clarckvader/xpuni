import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import type { AuthRequest } from '../types';

const registerSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.me = this.me.bind(this);
  }

  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
      }
      const result = await this.authService.register(parsed.data.email, parsed.data.password);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos inválidos' });
        return;
      }
      const result = await this.authService.login(parsed.data.email, parsed.data.password);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.getProfile(req.user!.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
