import { z } from "zod";

const dateStringSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha de nacimiento inválida');

export const createPetSchema = z.object({
      name: z.string().min(1, 'El nombre es requerido'),
      species: z.string().min(1, 'La especie es requerida'),
      breed: z.string().optional(),
      age: z.coerce.number().int().positive('La edad debe ser un número positivo').optional(),
      weight: z.coerce.number().positive('El peso debe ser un número positivo').optional(),
      weightKg: z.coerce.number().positive().optional(),
      sex: z.enum(['MALE', 'FEMALE']).optional(),
      color: z.string().optional(),
      microchip: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      chronicConditions: z.array(z.string()).optional(),
      birthDate: dateStringSchema.optional(),
      photoUrl: z.string().optional(),
    });
export const updatePetSchema = z.object({
      name: z.string().min(1).optional(),
      species: z.string().min(1).optional(),
      breed: z.string().optional(),
      age: z.coerce.number().int().positive().optional(),
      weight: z.coerce.number().positive().optional(),
      weightKg: z.coerce.number().positive().optional(),
      sex: z.enum(['MALE', 'FEMALE']).optional(),
      color: z.string().optional(),
      microchip: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      chronicConditions: z.array(z.string()).optional(),
      birthDate: dateStringSchema.optional(),
      photoUrl: z.string().optional(),
    });
