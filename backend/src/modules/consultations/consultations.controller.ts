import { Response } from 'express';
import { z } from 'zod';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors';
import { parsePagination } from '../../shared/utils';
import { getIO } from './chat.gateway';
import { notifyUser, notifyVetsOnline, notifyConsultationMessage } from '../notifications';
import {
  createConsultation,
  assignVet,
  declineConsultation,
  completeConsultation,
  getConsultationById,
  getConsultationsByUser,
  getConsultationHistory,
  getAvailableVets,
  getMessages,
  saveMessage,
  savePrescription,
  getPrescriptions,
  createReview,
} from './consultations.service';

const createSchema = z.object({
  petId: z.string().min(1, 'petId es requerido'),
  notes: z.string().min(5, 'Describí el motivo de la consulta (mín. 5 caracteres)').max(1000, 'El motivo no puede superar los 1000 caracteres'),
  vetId: z.string().min(1).optional(),
});

const completeSchema = z.object({
  notes: z.string().max(5000, 'Las notas no pueden superar los 5000 caracteres').optional(),
});

const sendMessageSchema = z
  .object({
    content: z.string().max(2000, 'El mensaje no puede superar los 2000 caracteres').optional(),
    attachmentUrl: z.string().startsWith('/uploads/', 'Imagen adjunta inválida').optional(),
    clientMsgId: z.string().max(100).optional(),
  })
  .refine((data) => data.content || data.attachmentUrl, {
    message: 'El mensaje no puede estar vacío',
  });

const prescriptionSchema = z.object({
  content: z.string().trim().min(1, 'La receta no puede estar vacía').max(5000, 'La receta no puede superar los 5000 caracteres'),
  medication: z.string().trim().max(200).optional().or(z.literal('')),
  dosage: z.string().trim().max(200).optional().or(z.literal('')),
  frequency: z.string().trim().max(200).optional().or(z.literal('')),
  durationDays: z.string().trim().max(200).optional().or(z.literal('')),
  indications: z.string().trim().max(1000).optional().or(z.literal('')),
});

async function assertParticipation(consultationId: string, userId: string) {
  const consultation = await getConsultationById(consultationId);
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== userId && consultation.vetId !== userId) {
    throw new ForbiddenError('No participás de esta consulta');
  }
  return consultation;
}

/**
 * Emite un cambio de consulta a la sala de la consulta y a las salas
 * personales (user:{id}) del client y del vet, para que las listas se
 * actualicen en vivo sin depender de polling.
 */
function emitConsultationUpdate(event: string, consultation: { id: string; clientId?: string | null; vetId?: string | null }) {
  const io = getIO();
  if (!io) return;
  io.to(`consultation:${consultation.id}`).emit(event, consultation);
  if (consultation.clientId) io.to(`user:${consultation.clientId}`).emit(event, consultation);
  if (consultation.vetId) io.to(`user:${consultation.vetId}`).emit(event, consultation);
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
      vetId: parsed.data.vetId,
    });
    emitConsultationUpdate('consultation:new', consultation);
    if (consultation.status === 'WAITING') {
      await notifyVetsOnline(
        'consultation_new',
        'Nueva consulta en espera',
        'Un cliente está esperando atención',
        { consultationId: consultation.id }
      );
    } else if (consultation.status === 'PENDING' && consultation.vetId) {
      await notifyUser(
        consultation.vetId,
        'consultation_offer',
        'Nueva consulta asignada',
        'Un cliente te eligió para atender a su mascota',
        { consultationId: consultation.id }
      );
    }
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
    emitConsultationUpdate('consultation:updated', consultation);
    await notifyUser(
      consultation.clientId,
      'consultation_assigned',
      'Un veterinario tomó tu consulta',
      'Un veterinario está listo para atenderte',
      { consultationId: consultation.id }
    );
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en assignVetController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function declineVetController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (req.user.role !== 'VET' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo veterinarios pueden rechazar ofertas' });
    }
    const consultation = await declineConsultation(req.params.id as string, req.user.userId);
    emitConsultationUpdate('consultation:updated', consultation);
    await notifyVetsOnline(
      'consultation_new',
      'Consulta disponible en la cola',
      'Un veterinario rechazó una consulta y quedó disponible',
      { consultationId: consultation.id }
    );
    return res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en declineVetController:', error);
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
    await notifyUser(
      updated.clientId,
      'consultation_completed',
      'Consulta finalizada',
      'Tu veterinario cerró la consulta. Podés verla en el historial.',
      { consultationId: updated.id }
    );
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

export async function getMyHistoryController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await getConsultationHistory(req.user.userId, req.user.role, { page, limit, cursor });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en getMyHistoryController:', error);
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
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const messages = await getMessages(req.params.id as string, page, limit);
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
    const consultation = await assertParticipation(req.params.id as string, req.user.userId);
    if (consultation.status !== 'ACTIVE') {
      throw new ConflictError('La consulta no está activa. No podés enviar mensajes.');
    }
    const message = await saveMessage({
      consultationId: req.params.id as string,
      senderId: req.user.userId,
      content: parsed.data.content,
      attachmentUrl: parsed.data.attachmentUrl,
      clientMsgId: parsed.data.clientMsgId,
    });
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('message:new', message);
      }
    } catch {
      // Socket not available, messages still reachable via polling
    }
    await notifyConsultationMessage(req.params.id as string, req.user.userId);
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
      medication: parsed.data.medication,
      dosage: parsed.data.dosage,
      frequency: parsed.data.frequency,
      durationDays: parsed.data.durationDays,
      indications: parsed.data.indications,
    });
    try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('prescription:new', prescription);
      }
    } catch {
      // Socket not available, prescriptions still reachable via polling
    }
    await notifyUser(
      consultation.clientId,
      'prescription_new',
      'Nueva receta médica',
      'Tu veterinario agregó una receta a la consulta',
      { consultationId: consultation.id }
    );
    return res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createPrescriptionController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

const reviewSchema = z.object({
  rating: z.coerce.number({ message: 'rating debe ser un número' }).int().min(1, 'La calificación mínima es 1').max(10, 'La calificación máxima es 10'),
  comment: z.string().trim().min(10, 'Cuéntanos un poco más: tu opinión debe tener al menos 10 caracteres').max(500, 'El comentario no puede superar los 500 caracteres'),
});

export async function createReviewController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }
    const review = await createReview({
      consultationId: req.params.id as string,
      clientId: req.user.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error en createReviewController:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
