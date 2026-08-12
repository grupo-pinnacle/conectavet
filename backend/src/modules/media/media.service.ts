import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import multer from 'multer';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Mapeo de MIME a extensión segura. Nunca se usa la extensión del cliente
// (evita XSS por archivos .svg/.html disfrazados de imagen).
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

mkdirSync(UPLOADS_DIR, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = MIME_EXT[file.mimetype];
      if (!ext) return cb(new AppError('Tipo de archivo no permitido', 400), '');
      cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new AppError('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)', 400));
  },
});

export async function saveAttachment(data: {
  uploaderId: string;
  filename: string;
  mimeType: string;
  size: number;
}) {
  return prisma.attachment.create({
    data: {
      uploaderId: data.uploaderId,
      url: `/uploads/${data.filename}`,
      mimeType: data.mimeType,
      size: data.size,
    },
  });
}