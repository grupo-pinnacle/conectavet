import { Response } from 'express';
import { RequestWithUser } from '../../shared/middlewares/auth.middleware';
import { AppError, NotFoundError, ForbiddenError, ConflictError, handleError } from '../../shared/errors';
import { parsePagination } from '../../shared/utils';
import { getIO } from './chat.gateway';
import { notifyUser, notifyVetsOnline, notifyConsultationMessage } from '../notifications';
import {
  createConsultation,
  assignVet,
  declineConsultation,
  assignNextPendingVet,
  cancelConsultation,
  completeConsultation,
  getConsultationById,
  getConsultationSnapshotById,
  getConsultationsByUser,
  getConsultationHistory,
  getAvailableVets,
  getMessages,
  sendConsultationMessage,
  savePrescription,
  getPrescriptions,
  createReview,
} from './consultations.service';
import { asyncHandler } from "../../shared/middlewares/async.middleware.js";
export const sendMessageSchema = z
  .object({
    content: z.string().max(2000, 'El mensaje no puede superar los 2000 caracteres').optional(),
    attachmentUrl: z.string().refine(val => val.startsWith('/uploads/') || val.startsWith('https://'), 'Imagen adjunta inválida').optional(),
    clientMsgId: z.string().max(100).optional(),
  })
  .refine((data) => data.content || data.attachmentUrl, {
    message: 'El mensaje no puede estar vacío',
  });

async function assertParticipation(consultationId: string, userId: string) {
  const consultation = await getConsultationSnapshotById(consultationId);
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

export const createController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const consultation = await createConsultation({
      clientId: req.user.userId,
      petId: req.body.petId,
      notes: req.body.notes,
      vetId: req.body.vetId,
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
});

export const assignVetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
});

export const declineVetController = asyncHandler(async (req: RequestWithUser, res: Response) => {
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
});

export const cancelController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user || req.user.role !== 'CLIENT') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }
const updated = await cancelConsultation(req.params.id as string, req.user.userId);
if (updated.vetId) {
      getIO().to(`user:${updated.vetId}`).emit('consultation:updated', updated);
    }
return res.json({ success: true, data: updated });
});

export const completeController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const consultation = await assertParticipation(req.params.id as string, req.user.userId);
if (req.user.role !== 'ADMIN' && consultation.vetId !== req.user.userId) {
      throw new ForbiddenError('Solo el veterinario asignado puede cerrar esta consulta');
    }
const updated = await completeConsultation(req.params.id as string, req.body.notes);
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
});

export const getByIdController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const consultation = await assertParticipation(req.params.id as string, req.user.userId);
return res.status(200).json({ success: true, data: consultation });
});

export const getMyConsultationsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const { page, limit } = parsePagination(req.query as Record<string, string>);
const result = await getConsultationsByUser(req.user.userId, req.user.role, page, limit);
return res.status(200).json({ success: true, ...result });
});

export const getMyHistoryController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const { page, limit } = parsePagination(req.query as Record<string, string>);
const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
const result = await getConsultationHistory(req.user.userId, req.user.role, { page, limit, cursor });
return res.status(200).json({ success: true, ...result });
});

export const getAvailableVetsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
const species = (req.query.species as string)?.trim() || undefined;
const vets = await getAvailableVets(species);
return res.status(200).json({ success: true, data: vets });
});

export const getMessagesController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await assertParticipation(req.params.id as string, req.user.userId);
const { page, limit } = parsePagination(req.query as Record<string, string>);
const messages = await getMessages(req.params.id as string, page, limit);
return res.status(200).json({ success: true, data: messages });
});

export const sendMessageController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const result = await sendConsultationMessage({
      userId: req.user.userId,
      consultationId: req.params.id as string,
      content: req.body.content,
      attachmentUrl: req.body.attachmentUrl,
      clientMsgId: req.body.clientMsgId,
    });
try {
      const io = getIO();
      if (io) {
        io.to(`consultation:${req.params.id}`).emit('message:new', result.message);
      }
    } catch {
      // Socket not available, messages still reachable via polling
    }
await notifyConsultationMessage(req.params.id as string, req.user.userId);
return res.status(201).json({ success: true, data: result.message });
});

export const getPrescriptionsController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
await assertParticipation(req.params.id as string, req.user.userId);
const prescriptions = await getPrescriptions(req.params.id as string);
return res.status(200).json({ success: true, data: prescriptions });
});

export const createPrescriptionController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const consultation = await assertParticipation(req.params.id as string, req.user.userId);
if (consultation.vetId !== req.user.userId) {
      throw new ForbiddenError('Solo el veterinario asignado puede enviar recetas');
    }
const prescription = await savePrescription({
      consultationId: req.params.id as string,
      vetId: req.user.userId,
      content: req.body.content,
      medication: req.body.medication,
      dosage: req.body.dosage,
      frequency: req.body.frequency,
      durationDays: req.body.durationDays,
      indications: req.body.indications,
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
});
export const createReviewController = asyncHandler(async (req: RequestWithUser, res: Response) => {
if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
const review = await createReview({
      consultationId: req.params.id as string,
      clientId: req.user.userId,
      rating: req.body.rating,
      comment: req.body.comment,
    });
return res.status(201).json({ success: true, data: review });
});
