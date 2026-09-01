import { z } from "zod";

// ---- Auth ----
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Rol solicitado; el servidor solo permite CLIENT o VET (ADMIN es manual).
  role: z.enum(["CLIENT", "VET"]).default("CLIENT"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

// ---- Pets ----
export const petCreateSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
  age: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  weightKg: z.number().nonnegative().optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z.coerce.date().optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  photoUrl: z.string().url().optional(),
});
export const petUpdateSchema = petCreateSchema.partial();

// ---- Consultations ----
export const createConsultationSchema = z.object({
  petId: z.string().cuid(),
  reason: z.string().min(10, "Describí el motivo (mín. 10 caracteres)").max(1000),
});
export const completeConsultationSchema = z.object({ notes: z.string().optional() });
export const sendMessageSchema = z.object({
  consultationId: z.string().cuid(),
  content: z.string().max(2000).optional(),
  attachmentUrl: z.string().optional(),
  clientMsgId: z.string().optional(),
});
export const rateSchema = z.object({ rating: z.number().int().min(1).max(10), comment: z.string().optional() });
export const prescriptionCreateSchema = z.object({
  consultationId: z.string().cuid(),
  content: z.string().min(1),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  durationDays: z.string().optional(),
  indications: z.string().optional(),
});

// ---- Notifications ----
export const pushTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(["android", "ios", "web"]),
});

// ---- Media ----
export const mediaTypeSchema = z.enum(["image", "video", "raw"]);
export const getUploadParamsSchema = z.object({
  type: mediaTypeSchema,
  context: z.string().optional(), // ej: "consultation/123", "pet/photo", "prescription"
  maxSizeBytes: z.number().int().positive().optional(),
  allowedFormats: z.array(z.string()).optional(),
});

export const confirmUploadSchema = z.object({
  publicId: z.string(),
  type: mediaTypeSchema,
  context: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
  bytes: z.number().int().positive().optional(),
});
