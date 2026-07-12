import api from '@/lib/api';
import type {
  AuthResponse,
  ChatMessage,
  Consultation,
  CreateConsultationPayload,
  CreatePetPayload,
  LoginPayload,
  Pet,
  RateConsultationPayload,
  RegisterPayload,
  UpdatePetPayload,
  VetCard,
} from '@/types';

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

export const petsService = {
  list: (params?: { species?: string; isDeceased?: boolean }) =>
    api.get<Pet[]>('/pets', { params }),
  getById: (id: string) => api.get<Pet>(`/pets/${id}`),
  create: (payload: CreatePetPayload) => api.post<Pet>('/pets', payload),
  update: (id: string, payload: UpdatePetPayload) => api.patch<Pet>(`/pets/${id}`, payload),
  remove: (id: string) => api.delete(`/pets/${id}`),
  vetCard: (id: string) => api.get<VetCard>(`/pets/${id}/vetcard`),
};

export const consultationsService = {
  create: (payload: CreateConsultationPayload) =>
    api.post<Consultation>('/consultations', payload),
  getById: (id: string) => api.get<Consultation>(`/consultations/${id}`),
  myHistory: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<Consultation[]>('/consultations/my-history', { params }),
  rate: (entryId: string, payload: RateConsultationPayload) =>
    api.post(`/consultations/${entryId}/rate`, payload),
  getMessages: (consultationId: string) =>
    api.get<ChatMessage[]>(`/consultations/${consultationId}/messages`),
  sendMessage: (consultationId: string, content: string) =>
    api.post<ChatMessage>(`/consultations/${consultationId}/messages`, { content }),
};
