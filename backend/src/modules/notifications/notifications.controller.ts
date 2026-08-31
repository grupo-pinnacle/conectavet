import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError } from '../../shared/errors';
import {
  registerPushToken,
  unregisterPushToken,
  listNotifications,
  markNotificationRead,
} from './notifications.service';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";
export const registerTokenController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const token = await registerPushToken(req.user.userId, req.body.token, req.body.platform);
return res.status(201).json({ success: true, data: token });
});

export const deleteTokenController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await unregisterPushToken(req.user.userId, req.body.token);
return res.status(200).json({ success: true, data: { removed: true } });
});

export const listNotificationsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const result = await listNotifications(req.user.userId);
return res.status(200).json({ success: true, data: result });
});

export const markReadController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const marked = await markNotificationRead(req.user.userId, req.params.id as string);
if (!marked) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
return res.status(200).json({ success: true, data: { id: req.params.id, readAt: new Date() } });
});