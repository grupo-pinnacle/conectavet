/**
 * Service layer — thin wrappers around the axios `api` instance.
 *
 * Each service corresponds to one backend module (SP-01 → SP-07) and exposes
 * typed methods matching the REST endpoints. The web app calls the same
 * endpoints with the same shapes — see INTEGRATION.md §2 for the full table.
 */
import api from '@/lib/api';
import type {
  AuthResponse,
  Consultation,
  Conversation,
  CreateConversationPayload,
  CreatePetPayload,
  JoinQueuePayload,
  LoginPayload,
  Message,
  Pet,
  RateConsultationPayload,
  RegisterPayload,
  UpdatePetPayload,
  VetCard,
} from '@/types';

// ── Auth (SP-01) ─────────────────────────────────────────────────────────
export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', { ...payload, platform: 'mobile' }),
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', { ...payload, platform: 'mobile' }),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken, platform: 'mobile' }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken, platform: 'mobile' }),
  me: () => api.get<{ user: import('@/types').User }>('/auth/me'),
};

// ── Pets (SP-02) ─────────────────────────────────────────────────────────
export const petsService = {
  list: (params?: { species?: string; isDeceased?: boolean }) =>
    api.get<Pet[]>('/pets', { params }),
  getById: (id: string) => api.get<Pet>(`/pets/${id}`),
  create: (payload: CreatePetPayload) => api.post<Pet>('/pets', payload),
  update: (id: string, payload: UpdatePetPayload) => api.patch<Pet>(`/pets/${id}`, payload),
  remove: (id: string) => api.delete(`/pets/${id}`),
  vetCard: (id: string) => api.get<VetCard>(`/pets/${id}/vetcard`),
};

// ── Queue (SP-03) ────────────────────────────────────────────────────────
export const queueService = {
  join: (payload: JoinQueuePayload) => api.post<import('@/types').QueueEntry>('/queue/join', payload),
  myEntry: () => api.get<import('@/types').QueueEntry | null>('/queue/my-entry'),
  cancel: () => api.post('/queue/my-entry/cancel'),
  confirmConnection: (entryId: string) =>
    api.post(`/queue/${entryId}/confirm-connection`),
  finalize: (entryId: string) => api.post(`/queue/${entryId}/finalize`),
};

// ── Consultations (SP-04) ────────────────────────────────────────────────
export const consultationsService = {
  ping: (entryId: string) => api.post(`/consultations/${entryId}/ping`),
  rate: (entryId: string, payload: RateConsultationPayload) =>
    api.post(`/consultations/${entryId}/rate`, payload),
  getById: (id: string) => api.get<Consultation>(`/consultations/${id}`),
  myHistory: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<Consultation[]>('/consultations/my-history', { params }),
};

// ── AI Assistant (SP-06) ─────────────────────────────────────────────────
export const chatService = {
  createConversation: (payload: CreateConversationPayload) =>
    api.post<Conversation>('/ai-assistant/conversations', payload),
  listConversations: (params?: { page?: number; limit?: number }) =>
    api.get<Conversation[]>('/ai-assistant/conversations', { params }),
  getMessages: (conversationId: string) =>
    api.get<Message[]>(`/ai-assistant/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post<Message>(`/ai-assistant/conversations/${conversationId}/messages`, { content }),
  archive: (conversationId: string) =>
    api.patch(`/ai-assistant/conversations/${conversationId}/archive`),
  escalate: (conversationId: string) =>
    api.post(`/ai-assistant/conversations/${conversationId}/escalate`),
};
