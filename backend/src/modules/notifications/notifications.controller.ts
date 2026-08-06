import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
import {
  registerPushToken,
  unregisterPushToken,
  listNotifications,
  markNotificationRead,
} from './notifications.service';

const tokenSchema = z.object({
  token: z.string().min(5, 'Token inválido').max(500, 'Token inválido'),
  platform: z.enum(['android', 'ios', 'web'], 'Plataforma inválida'),
});

const deleteTokenSchema = z.object({
  token: z.string().min(1, 'Token requerido').max(500),
});

export async function registerTokenController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const token = await registerPushToken(req.user.userId, parsed.data.token, parsed.data.platform);
    return res.status(201).json({ success: true, data: token });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en registerTokenController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function deleteTokenController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = deleteTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    await unregisterPushToken(req.user.userId, parsed.data.token);
    return res.status(200).json({ success: true, data: { removed: true } });
  } catch (error) {
    console.error('Error en deleteTokenController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function listNotificationsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const result = await listNotifications(req.user.userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en listNotificationsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function markReadController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const marked = await markNotificationRead(req.user.userId, req.params.id as string);
    if (!marked) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
    return res.status(200).json({ success: true, data: { id: req.params.id, readAt: new Date() } });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en markReadController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}