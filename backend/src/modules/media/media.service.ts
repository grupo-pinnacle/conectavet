import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import multer from 'multer';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { persistUpload } from './storage';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Tope diario por usuario: evita que cualquiera suba de forma indefinida
// (P3-18). El escaneo antivirus real debe hacerse con un proveedor externo.
export const DAILY_UPLOAD_QUOTA = 30;

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
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new AppError('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)', 400));
  },
});

function validateMagicBytes(buffer: Buffer): boolean {
  const hex = buffer.toString('hex', 0, 12).toUpperCase();
  // JPEG: FFD8FF
  if (hex.startsWith('FFD8FF')) return true;
  // PNG: 89504E47
  if (hex.startsWith('89504E47')) return true;
  // GIF: GIF87a or GIF89a -> 47494638
  if (hex.startsWith('47494638')) return true;
  // WEBP: RIFF....WEBP -> Starts with 52494646 and bytes 8-11 are 57454250
  if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') return true;
  return false;
}

export async function saveAttachment(data: {
  uploaderId: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}) {
  // Cuota diaria por usuario (P3-18): cualquier usuario autenticado podía
  // subir sin límite. Contamos las subidas de las últimas 24h y rechazamos
  // con 429 si supera el tope.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayCount = await prisma.attachment.count({
    where: { uploaderId: data.uploaderId, createdAt: { gte: since } },
  });
  if (todayCount >= DAILY_UPLOAD_QUOTA) {
    throw new AppError('Límite diario de subidas alcanzado. Intentá mañana.', 429);
  }

  // Re-validación defensiva del tipo de archivo (no confiamos solo en multer).
  if (!ALLOWED_MIME.includes(data.mimeType)) {
    throw new AppError('Tipo de archivo no permitido', 400);
  }

  if (!validateMagicBytes(data.buffer)) {
    throw new AppError('El archivo no es una imagen válida o está corrupto (MIME Spoofing detectado)', 400);
  }

  const ext = MIME_EXT[data.mimeType];
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
  const url = await persistUpload(data.buffer, filename, data.mimeType);

  return prisma.attachment.create({
    data: {
      uploaderId: data.uploaderId,
      url,
      mimeType: data.mimeType,
      size: data.size,
    },
  });
}