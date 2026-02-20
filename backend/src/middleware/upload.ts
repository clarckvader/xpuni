import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import fs from 'fs';

// Asegura que el directorio de uploads exista
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y PDFs'));
    }
  },
});

/**
 * Construye la URL pública de un archivo subido.
 */
export function buildFileUrl(filename: string): string {
  return `${config.uploadsBaseUrl}/uploads/${filename}`;
}
