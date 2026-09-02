import { Response } from 'express';
import multer from 'multer';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
// import { logger } from '../../shared/logger';
import { saveAttachment } from './media.service';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";

export const uploadImageController = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Adjuntá una imagen' });
  }
  const attachment = await saveAttachment({
    uploaderId: req.user.userId,
    mimeType: req.file.mimetype,
    size: req.file.size,
    filePath: req.file.path,
    buffer: req.file.buffer,
  });
  return res.status(201).json({ success: true, data: attachment });
});

export function handleUploadErrors(
  err: Error,
  _req: RequestWithUser,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: (e: Error) => unknown
) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el tamaño máximo de 5MB'
        : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: 'Error interno del servidor' });
}