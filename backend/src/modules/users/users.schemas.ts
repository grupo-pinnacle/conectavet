import { z } from "zod";

export const availabilitySchema = z.object({
      isOnline: z.boolean({ message: 'isOnline debe ser un booleano' }),
    });
export const createUserSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
      firstName: z.string().max(50).optional(),
      lastName: z.string().max(50).optional(),
      phone: z.string().max(20).optional(),
      role: z.enum(['CLIENT', 'VET', 'ADMIN']),
      specialty: z.string().max(100).optional(),
    });
export const updateProfileSchema = z.object({
      firstName: z.string().trim().min(1, 'El nombre no puede estar vacío').max(100).optional(),
      lastName: z.string().trim().min(1, 'El apellido no puede estar vacío').max(100).optional(),
      phone: z.string().trim().max(30).optional(),
      bio: z.string().trim().max(500, 'La bio no puede superar los 500 caracteres').optional(),
      specialty: z.string().trim().max(100, 'La especialidad no puede superar los 100 caracteres').optional(),
    }).refine((d) => Object.values(d).some((v) => v !== undefined), {
      message: 'Enviá al menos un campo para actualizar',
    });
export const updateVetStatusSchema = z.object({
      vetStatus: z.enum(['PENDING', 'APPROVED']),
    });
