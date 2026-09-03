import { z } from "zod";
const dateStringSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha de nacimiento inválida');

// "" equivale a ausente: evita que un campo limpiado se persista
// como string vacío o bloquee a clientes (ej. mobile) que lo envían así.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const breedSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(2, 'La raza debe tener al menos 2 caracteres').max(80, 'La raza no puede superar los 80 caracteres').optional(),
);
const weightSchema = z.coerce
  .number()
  .positive('El peso debe ser un número positivo')
  .max(500, 'El peso no puede superar los 500 kg')
  .optional();
const microchipSchema = z
  .string()
  .regex(/^\d{15}$/, 'El microchip debe tener exactamente 15 dígitos')
  .optional();

export const createPetSchema = z.object({
      name: z.string().trim().min(1, 'El nombre es requerido').max(50, 'El nombre no puede superar los 50 caracteres'),
      species: z.string().trim().min(1, 'La especie es requerida'),
      breed: breedSchema,
      age: z.coerce.number().int().positive('La edad debe ser un número positivo').optional(),
      weight: weightSchema,
      weightKg: weightSchema,
      sex: z.enum(['MALE', 'FEMALE']).optional(),
      color: z.string().trim().max(50, 'El color no puede superar los 50 caracteres').optional(),
      microchip: microchipSchema,
      allergies: z.array(z.string().trim().max(50, 'Cada alergia no puede superar los 50 caracteres')).max(20, 'Máximo 20 alergias').optional(),
      chronicConditions: z.array(z.string().trim().max(80, 'Cada condición no puede superar los 80 caracteres')).max(20, 'Máximo 20 condiciones').optional(),
      birthDate: dateStringSchema.optional(),
      photoUrl: z.string().optional(),
    });
export const updatePetSchema = z.object({
      name: z.string().trim().min(1, 'El nombre es requerido').max(50, 'El nombre no puede superar los 50 caracteres').optional(),
      species: z.string().trim().min(1, 'La especie es requerida').optional(),
      breed: breedSchema,
      age: z.coerce.number().int().positive('La edad debe ser un número positivo').optional(),
      weight: weightSchema,
      weightKg: weightSchema,
      sex: z.enum(['MALE', 'FEMALE']).optional(),
      color: z.string().trim().max(50, 'El color no puede superar los 50 caracteres').optional(),
      microchip: microchipSchema,
      allergies: z.array(z.string().trim().max(50, 'Cada alergia no puede superar los 50 caracteres')).max(20, 'Máximo 20 alergias').optional(),
      chronicConditions: z.array(z.string().trim().max(80, 'Cada condición no puede superar los 80 caracteres')).max(20, 'Máximo 20 condiciones').optional(),
      birthDate: dateStringSchema.optional(),
      photoUrl: z.string().optional(),
    });
