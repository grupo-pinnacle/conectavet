import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errors';
import { parsePagination } from '../../shared/utils';
import { getIO } from './chat.gateway';
import {
  createConsultation,
  assignVet,
  completeConsultation,
  getConsultationById,
  getConsultationsByUser,
  getAvailableVets,
  getMessages,
  saveMessage,
  savePrescription,
  getPrescriptions,
} from './consultations.service';

const createSchema = z.object({
  petId: z.string().min(1, 'petId es requerido'),
  notes: z.string().min(5, 'Describí el motivo de la consulta (mín. 5 caracteres)').max(1000, 'El motivo no puede superar los 1000 caracteres'),
});

const completeSchema = z.object({
  notes: z.string().max(5000, 'Las notas no pueden superar los 5000 caracteres').optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(2000, 'El mensaje no puede superar los 2000 caracteres'),
});

const prescriptionSchema = z.object({
  content: z.string().trim().min(1, 'La receta no puede estar vacía').max(5000, 'La receta no puede superar los 5000 caracteres'),
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
      notes: parsed.data.notes,
    });
    try {
      const io = getIO();
      if (io) {
        io.emit('consultation:new', consultation);
      }
    } catch {}
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
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('consultation:updated', consultation);
      }
    } catch {}
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
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('consultation:updated', updated);
      }
    } catch {}
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

export async function getAvailableVetsController(req: RequestWithUser, res: Response) {
  try {
    const species = (req.query.species as string)?.trim() || undefined;
    const vets = await getAvailableVets(species);
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

export async function sendMessageController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    await assertParticipation(req.params.id as string, req.user.userId);
    const message = await saveMessage({
      consultationId: req.params.id as string,
      senderId: req.user.userId,
      content: parsed.data.content,
    });
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('message:new', message);
      }
    } catch {
      // Socket not available, messages still reachable via polling
    }
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en sendMessageController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getPrescriptionsController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    await assertParticipation(req.params.id as string, req.user.userId);
    const prescriptions = await getPrescriptions(req.params.id as string);
    return res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getPrescriptionsController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function createPrescriptionController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = prescriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const consultation = await assertParticipation(req.params.id as string, req.user.userId);
    if (consultation.vetId !== req.user.userId) {
      throw new ForbiddenError('Solo el veterinario asignado puede enviar recetas');
    }
    const prescription = await savePrescription({
      consultationId: req.params.id as string,
      vetId: req.user.userId,
      content: parsed.data.content,
    });
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('prescription:new', prescription);
      }
    } catch {
      // Socket not available, prescriptions still reachable via polling
    }
    return res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createPrescriptionController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
