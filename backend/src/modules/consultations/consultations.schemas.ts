import { z } from "zod";

export const createSchema = z.object({
      petId: z.string().min(1, 'petId es requerido'),
      notes: z.string().min(5, 'Describí el motivo de la consulta (mín. 5 caracteres)').max(1000, 'El motivo no puede superar los 1000 caracteres'),
      vetId: z.string().min(1).optional(),
    });
export const completeSchema = z.object({
      notes: z.string().max(5000, 'Las notas no pueden superar los 5000 caracteres').optional(),
    });
export const prescriptionSchema = z.object({
      content: z.string().trim().min(1, 'La receta no puede estar vacía').max(5000, 'La receta no puede superar los 5000 caracteres'),
      medication: z.string().trim().max(200).optional().or(z.literal('')),
      dosage: z.string().trim().max(200).optional().or(z.literal('')),
      frequency: z.string().trim().max(200).optional().or(z.literal('')),
      durationDays: z.string().trim().max(200).optional().or(z.literal('')),
      indications: z.string().trim().max(1000).optional().or(z.literal('')),
    });
export const reviewSchema = z.object({
      rating: z.coerce.number({ message: 'rating debe ser un número' }).int().min(1, 'La calificación mínima es 1').max(5, 'La calificación máxima es 5'),
      comment: z.string().trim().min(10, 'Cuéntanos un poco más: tu opinión debe tener al menos 10 caracteres').max(500, 'El comentario no puede superar los 500 caracteres'),
    });
export const sendMessageSchema = z
  .object({
    content: z.string().max(2000, 'El mensaje no puede superar los 2000 caracteres').optional(),
    attachmentUrl: z.string().refine(val => val.startsWith('/uploads/') || val.startsWith('https://'), 'Imagen adjunta inv�lida').optional(),
    clientMsgId: z.string().max(100).optional(),
  })
  .refine((data) => data.content || data.attachmentUrl, {
    message: 'El mensaje no puede estar vac�o',
  });
