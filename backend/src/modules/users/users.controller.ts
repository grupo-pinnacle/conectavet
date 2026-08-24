import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
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
} from './users.service';
import { assignNextPendingVet } from '../consultations/consultations.service';
import { getIO } from '../consultations/chat.gateway';
import { notifyUser } from '../notifications';
import { AppError } from '../../shared/errors';
import { parsePagination } from '../../shared/utils';

const availabilitySchema = z.object({
  isOnline: z.boolean({ message: 'isOnline debe ser un booleano' }),
});

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  role: z.enum(['CLIENT', 'VET', 'ADMIN']),
  specialty: z.string().max(100).optional(),
});

export async function createUserController(req: RequestWithUser, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const user = await createUser(parsed.data);
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createUserController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre no puede estar vacío').max(100).optional(),
  lastName: z.string().trim().min(1, 'El apellido no puede estar vacío').max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(500, 'La bio no puede superar los 500 caracteres').optional(),
  specialty: z.string().trim().max(100, 'La especialidad no puede superar los 100 caracteres').optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: 'Enviá al menos un campo para actualizar',
});

export async function getMeController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const user = await getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getMeController:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export async function adminOnlyController(req: RequestWithUser, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      message: 'Acceso permitido solo para administradores',
      user: req.user
    }
  });
}

export async function setAvailabilityController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const user = await updateAvailability(req.user.userId, parsed.data.isOnline);
    // Cola de espera en tiempo real:
    //  - se avisa a todos los clientes conectados del cambio de disponibilidad
    //  - si el vet se puso online, se le asigna la consulta WAITING más antigua
    try {
      const io = getIO();
      if (io) {
        io.emit('vet:availability', { vetId: user.id, isOnline: user.isOnline });
      }
      if (user.isOnline) {
        const assigned = await assignNextPendingVet(user.id);
        if (assigned) {
          try {
            const io = getIO();
            if (io) {
              io.to(`consultation:${assigned.id}`).emit('consultation:updated', assigned);
              io.to(`user:${assigned.clientId}`).emit('consultation:updated', assigned);
              // El vet también recibe el evento en su sala personal: sin esto,
              // su web recién se enteraba de la oferta con el polling de 10s.
              io.to(`user:${user.id}`).emit('consultation:new', assigned);
            }
          } catch {}
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
    } catch (error) {
      console.error('Error al emitir eventos de disponibilidad:', error);
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error en setAvailabilityController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function listVetsController(req: RequestWithUser, res: Response) {
  try {
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
  } catch (error) {
    console.error('Error en listVetsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getVetByIdController(req: RequestWithUser, res: Response) {
  try {
    const vet = await getVetById(req.params.id as string);
    return res.status(200).json({ success: true, data: vet });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getVetByIdController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function updateProfileController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const user = await updateProfile(req.user.userId, parsed.data);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error en updateProfileController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function addFavoriteController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    await addFavorite(req.user.userId, req.params.id as string);
    return res.status(200).json({ success: true, data: { favorited: true } });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en addFavoriteController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function removeFavoriteController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    await removeFavorite(req.user.userId, req.params.id as string);
    return res.status(200).json({ success: true, data: { favorited: false } });
  } catch (error) {
    console.error('Error en removeFavoriteController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function listFavoritesController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const favorites = await listFavorites(req.user.userId);
    return res.status(200).json({ success: true, data: favorites });
  } catch (error) {
    console.error('Error en listFavoritesController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
