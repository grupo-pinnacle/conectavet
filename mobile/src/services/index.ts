import api from '@/lib/api';
import type {
  AppNotification,
  Attachment,
  AuthResponse,
  ChatMessage,
  Consultation,
  CreateConsultationPayload,
  CreatePetPayload,
  LoginPayload,
  Pet,
  Prescription,
  RegisterPayload,
  UpdatePetPayload,
  VetCard,
} from '@/types';

export type SendMessagePayload = { content?: string; attachmentUrl?: string };

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
  getMessages: (consultationId: string) =>
    api.get<ChatMessage[]>(`/consultations/${consultationId}/messages`),
  sendMessage: (consultationId: string, payload: SendMessagePayload) =>
    api.post<ChatMessage>(`/consultations/${consultationId}/messages`, payload),
  getPrescriptions: (consultationId: string) =>
    api.get<Prescription[]>(`/consultations/${consultationId}/prescriptions`),
};

export const mediaService = {
  upload: (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    return api.post<Attachment>('/media', form);
  },
};

export const notificationsService = {
  registerToken: (token: string, platform: 'android' | 'ios' | 'web') =>
    api.post('/notifications/token', { token, platform }),
  list: () => api.get<{ items: AppNotification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};
