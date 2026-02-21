import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors[0]?.message ?? 'Datos inválidos' });
    return;
  }

  // Multer file-type error
  if (err instanceof Error && err.message?.startsWith('Solo se permiten')) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
