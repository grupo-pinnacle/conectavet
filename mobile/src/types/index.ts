/**
 * Replica of the `@vetconnect/shared-types` package (Zod schemas + derived TS types).
 *
 * The web app imports these from `packages/shared-types`. In the mobile app we
 * keep a local copy because Expo's bundler cannot always resolve a sibling
 * workspace package cleanly without extra Metro config, and because the mobile
 * build must remain self-contained when distributed as an APK.
 *
 * Schemas here MUST be kept in sync with `packages/shared-types/src/*` in the
 * monorepo. See INTEGRATION.md for the contract.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// Common
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Auth + Users
// ─────────────────────────────────────────────
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
  refreshToken: z.string().optional(), // Mobile: returned in body; web: httpOnly cookie
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ─────────────────────────────────────────────
// Pets + VetCard
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Queue
// ─────────────────────────────────────────────
export const queueEntryStatusSchema = z.enum([
  'WAITING',
  'ASSIGNED',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
]);
export type QueueEntryStatus = z.infer<typeof queueEntryStatusSchema>;

export const queueEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  petId: z.string(),
  vetId: z.string().nullable(),
  status: queueEntryStatusSchema,
  reason: z.string(),
  joinedAt: z.string().datetime(),
  assignedAt: z.string().datetime().nullable(),
  consultationStartedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  cancellationReason: z.string().nullable(),
  livekitRoomName: z.string().nullable(),
  position: z.number().int().positive().optional(),
  livekitToken: z.string().optional(), // Returned on ENTRY_ASSIGNED WS event
});
export type QueueEntry = z.infer<typeof queueEntrySchema>;

export const joinQueueSchema = z.object({
  petId: z.string(),
  reason: z.string().min(5).max(500),
});
export type JoinQueuePayload = z.infer<typeof joinQueueSchema>;

// WebSocket message shapes (server → client)
export const wsMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pong') }),
  z.object({ type: z.literal('ENTRY_STATE'), entry: queueEntrySchema.nullable() }),
  z.object({
    type: z.literal('ENTRY_ASSIGNED'),
    entry: queueEntrySchema,
    livekitToken: z.string(),
    livekitRoomName: z.string(),
  }),
  z.object({ type: z.literal('CONSULTATION_STARTED'), entry: queueEntrySchema }),
  z.object({ type: z.literal('CONSULTATION_FINALIZED'), entry: queueEntrySchema }),
  z.object({ type: z.literal('ENTRY_REQUEUED'), entry: queueEntrySchema }),
  z.object({ type: z.literal('QUEUE_UPDATED') }),
]);
export type WsMessage = z.infer<typeof wsMessageSchema>;

// ─────────────────────────────────────────────
// AI Assistant
// ─────────────────────────────────────────────
export const conversationStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'ESCALATED']);
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  petId: z.string().nullable(),
  status: conversationStatusSchema,
  title: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageRoleSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  tokenInput: z.number(),
  tokenOutput: z.number(),
  costUsd: z.number(),
  flagged: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const createConversationSchema = z.object({
  petId: z.string().optional(),
  title: z.string().max(120).optional(),
});
export type CreateConversationPayload = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});
export type SendMessagePayload = z.infer<typeof sendMessageSchema>;

// ─────────────────────────────────────────────
// Consultations
// ─────────────────────────────────────────────
export const consultationSchema = queueEntrySchema.extend({
  consultationNotes: z.string().nullable(),
  consultationSummary: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  followUpRecommended: z.boolean().nullable(),
  followUpDate: z.string().datetime().nullable(),
  durationSeconds: z.number().nullable(),
  videoCallQuality: z.string().nullable(),
  petName: z.string().optional(),
  vetName: z.string().optional(),
});
export type Consultation = z.infer<typeof consultationSchema>;

export const rateConsultationSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type RateConsultationPayload = z.infer<typeof rateConsultationSchema>;
