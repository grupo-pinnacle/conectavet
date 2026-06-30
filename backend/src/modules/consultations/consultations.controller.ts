import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { parsePagination } from '../../shared/utils';
import {
  createConsultation,
  assignVet,
  completeConsultation,
  getConsultationById,
  getConsultationsByUser,
  getAvailableVets,
  getMessages,
} from './consultations.service';

const createSchema = z.object({
  petId: z.string().min(1, 'petId es requerido'),
});

const completeSchema = z.object({
  notes: z.string().max(5000, 'Las notas no pueden superar los 5000 caracteres').optional(),
});

async function assertParticipation(consultationId: string, userId: string) {
  const consultation = await getConsultationById(consultationId);
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== userId && consultation.vetId !== userId) {
    throw new ForbiddenError('No participás de esta consulta');
  }
  return consultation;
}

export async function createController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const consultation = await createConsultation({
      clientId: req.user.userId,
      petId: parsed.data.petId,
    });
    return res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function assignVetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (req.user.role !== 'VET' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo veterinarios pueden tomar consultas' });
    }
    const consultation = await assignVet(req.params.id as string, req.user.userId);
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en assignVetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function completeController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const consultation = await assertParticipation(req.params.id as string, req.user.userId);
    if (req.user.role !== 'ADMIN' && consultation.vetId !== req.user.userId) {
      throw new ForbiddenError('Solo el veterinario asignado puede cerrar esta consulta');
    }
    const updated = await completeConsultation(req.params.id as string, parsed.data.notes);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en completeController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getByIdController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const consultation = await assertParticipation(req.params.id as string, req.user.userId);
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getByIdController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getMyConsultationsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await getConsultationsByUser(req.user.userId, req.user.role, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getMyConsultationsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getAvailableVetsController(_req: RequestWithUser, res: Response) {
  try {
    const vets = await getAvailableVets();
    return res.status(200).json({ success: true, data: vets });
  } catch (error) {
    console.error('Error en getAvailableVetsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getMessagesController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    await assertParticipation(req.params.id as string, req.user.userId);
    const messages = await getMessages(req.params.id as string);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getMessagesController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
