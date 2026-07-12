import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    status: z.enum(['success', 'error']),
    data,
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      })
      .optional(),
  });

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const roleSchema = z.enum(['OWNER', 'VET', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: roleSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo');

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().regex(/^\+?[\d\s-]{6,20}$/, 'Teléfono inválido'),
});
export type RegisterPayload = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
export type LoginPayload = z.infer<typeof loginSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const speciesSchema = z.enum(['DOG', 'CAT', 'BIRD', 'REPTILE', 'RODENT', 'OTHER']);
export type Species = z.infer<typeof speciesSchema>;

export const sexSchema = z.enum(['MALE', 'FEMALE']);
export type Sex = z.infer<typeof sexSchema>;

export const petSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: speciesSchema,
  breed: z.string().nullable(),
  birthDate: z.string().datetime(),
  weightKg: z.number().nullable(),
  sex: sexSchema.nullable(),
  color: z.string().nullable(),
  microchip: z.string().nullable(),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
  photoUrl: z.string().nullable(),
  ownerId: z.string(),
  isDeceased: z.boolean(),
  deathDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Pet = z.infer<typeof petSchema>;

export const createPetSchema = z.object({
  name: z.string().min(1).max(50),
  species: speciesSchema,
  breed: z.string().max(80).optional(),
  birthDate: z.string().datetime(),
  weightKg: z.number().positive().max(500).optional(),
  sex: sexSchema.optional(),
  color: z.string().max(50).optional(),
  microchip: z.string().regex(/^\d{15}$/).optional(),
  allergies: z.array(z.string().max(50)).max(20).optional(),
  chronicConditions: z.array(z.string().max(80)).max(20).optional(),
  photoUrl: z.string().url().optional(),
});
export type CreatePetPayload = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial().extend({
  isDeceased: z.boolean().optional(),
  deathDate: z.string().datetime().optional(),
});
export type UpdatePetPayload = z.infer<typeof updatePetSchema>;

export const vetCardSchema = z.object({
  pet: petSchema,
  owner: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
  }),
  stats: z.object({
    totalConsultations: z.number(),
    lastConsultationDate: z.string().datetime().nullable(),
    ageYears: z.number(),
    ageMonths: z.number(),
  }),
  recentConsultations: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      status: z.string(),
      completedAt: z.string().datetime().nullable(),
    })
  ),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
});
export type VetCard = z.infer<typeof vetCardSchema>;

export const consultationStatusSchema = z.enum([
  'WAITING',
  'ASSIGNED',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
]);
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;

export const consultationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  petId: z.string(),
  vetId: z.string().nullable(),
  status: consultationStatusSchema,
  reason: z.string(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  consultationNotes: z.string().nullable(),
  consultationSummary: z.string().nullable(),
  followUpRecommended: z.boolean().nullable(),
  followUpDate: z.string().datetime().nullable(),
  durationSeconds: z.number().nullable(),
  petName: z.string().optional(),
  vetName: z.string().optional(),
  joinedAt: z.string().datetime(),
  assignedAt: z.string().datetime().nullable(),
  consultationStartedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Consultation = z.infer<typeof consultationSchema>;

export const rateConsultationSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type RateConsultationPayload = z.infer<typeof rateConsultationSchema>;

export const createConsultationSchema = z.object({
  petId: z.string(),
  reason: z.string().min(5).max(500),
});
export type CreateConsultationPayload = z.infer<typeof createConsultationSchema>;

export const chatMessageRoleSchema = z.enum(['USER', 'VET']);
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  userId: z.string(),
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;
