import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { prisma } from '../../shared/prisma';
import { ForbiddenError } from '../../shared/errors';
import {
  getUserById,
  listVets,
  updateAvailability,
  updateProfile,
  getVetById,
  addFavorite,
  removeFavorite,
  listFavorites,
  createUser,
  updateVetStatus,
  listAllUsers,
  getAdminStats, batchDeleteUsers, listAuditLogs,
} from './users.service';
import { assignNextPendingVet } from '../consultations/consultations.service';
import { getIO } from '../consultations/chat.gateway';
import { notifyUser } from '../notifications';

import { logger } from '../../shared/logger';
import { parsePagination } from '../../shared/utils';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";
export const createUserController = asyncHandler(async (req: RequestWithUser, res: Response) => {
const user = await createUser(req.body);
return res.status(201).json({ success: true, data: user });
});
export const getMeController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const user = await getUserById(req.user.userId);
if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
return res.status(200).json({ success: true, data: user });
});

export const adminOnlyController = asyncHandler(async (req: RequestWithUser, res: Response) => {
return res.status(200).json({
    success: true,
    data: { message: 'Acceso permitido solo para administradores', user: req.user },
  });
});

export const setAvailabilityController = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  if (req.user.role === 'VET') {
    const vet = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { vetStatus: true },
    });
    if (!vet || vet.vetStatus !== 'APPROVED') {
      throw new ForbiddenError('Tu cuenta está pendiente de verificación y aprobación por un administrador');
    }
  }

  const user = await updateAvailability(req.user.userId, req.body.isOnline);
  try {
    const io = getIO();
    if (io) {
      io.emit('vet:availability', { vetId: user.id, isOnline: user.isOnline });
    }
    if (user.isOnline) {
      const assigned = await assignNextPendingVet(user.id);
        if (assigned) {
          try {
            const io2 = getIO();
            if (io2) {
              io2.to(`consultation:${assigned.id}`).emit('consultation:updated', assigned);
              io2.to(`user:${assigned.clientId}`).emit('consultation:updated', assigned);
              // El vet también recibe el evento en su sala personal: sin esto,
              // su web recién se enteraba de la oferta con el polling de 10s.
              io2.to(`user:${user.id}`).emit('consultation:new', assigned);
            }
          } catch { /* Socket IO error — no crítico */ }
        }
        if (assigned) {
          await notifyUser(
            assigned.clientId,
            'consultation_offer',
            'Un veterinario quiere atenderte',
            'Un veterinario está revisando tu consulta',
            { consultationId: assigned.id }
          );
        }
      }
    } catch (socketError) {
      logger.warn('Error al emitir eventos de disponibilidad', {
        message: (socketError as Error)?.message,
      });
    }
return res.status(200).json({ success: true, data: user });
});

export const listVetsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
const { page, limit } = parsePagination(req.query as Record<string, string>);
const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
const onlineOnly = req.query.online === 'true';
const minRating = typeof req.query.minRating === 'string' && req.query.minRating !== ''
      ? Math.max(0, Math.min(5, Number(req.query.minRating) || 0))
      : undefined;
const sortBy = req.query.sortBy === 'rating' ? 'rating' : 'recent';
const result = await listVets(page, limit, {
      search,
      onlineOnly,
      viewerId: req.user?.userId,
      minRating,
      sortBy,
    });
return res.status(200).json({ success: true, ...result });
});

export const getVetByIdController = asyncHandler(async (req: RequestWithUser, res: Response) => {
const vet = await getVetById(req.params.id as string);
return res.status(200).json({ success: true, data: vet });
});
export const updateVetStatusController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const user = await updateVetStatus(req.params.id as string, req.body.vetStatus);
return res.status(200).json({ success: true, data: user });
});

export const updateProfileController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const user = await updateProfile(req.user.userId, req.body);
return res.status(200).json({ success: true, data: user });
});

export const addFavoriteController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await addFavorite(req.user.userId, req.params.id as string);
return res.status(200).json({ success: true, data: { favorited: true } });
});

export const removeFavoriteController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await removeFavorite(req.user.userId, req.params.id as string);
return res.status(200).json({ success: true, data: { favorited: false } });
});

export const listFavoritesController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const favorites = await listFavorites(req.user.userId);
return res.status(200).json({ success: true, data: favorites });
});

export const listAllUsersController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });
const { page = '1', limit = '30', search, role } = req.query as Record<string, string | undefined>;
const result = await listAllUsers(Number(page), Number(limit), search, role);
return res.status(200).json({ success: true, data: result });
});

export const getAdminStatsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' });
const stats = await getAdminStats();
return res.status(200).json({ success: true, data: stats });
});
export const batchDeleteUsersController = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ success: false, message: 'userIds debe ser un array' });
  }
  await batchDeleteUsers(req.user.userId, userIds);
  return res.status(200).json({ success: true, message: 'Usuarios eliminados/anonimizados correctamente' });
});

export const getAuditLogsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  const { page = '1', limit = '50' } = req.query as Record<string, string>;
  const result = await listAuditLogs(Number(page), Number(limit));
  return res.status(200).json({ success: true, data: result });
});
