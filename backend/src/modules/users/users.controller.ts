import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { getUserById, listVets, updateAvailability } from './users.service';
import { assignNextPendingVet } from '../consultations/consultations.service';
import { getIO } from '../consultations/chat.gateway';
import { notifyUser } from '../notifications';

const availabilitySchema = z.object({
  isOnline: z.boolean({ message: 'isOnline debe ser un booleano' }),
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
        if (assigned && io) {
          io.to(`consultation:${assigned.id}`).emit('consultation:updated', assigned);
        }
        if (assigned) {
          await notifyUser(
            assigned.clientId,
            'consultation_assigned',
            'Un veterinario tomó tu consulta',
            'Un veterinario está listo para atenderte',
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const result = await listVets(page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error en listVetsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
