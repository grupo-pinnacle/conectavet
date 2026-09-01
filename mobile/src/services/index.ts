import api from '@/lib/api';
import { enqueueMessage, getPendingMessages, removeMessage } from '@/lib/outbox';
import type {
  AppNotification,
  Attachment,
  AuthResponse,
  ChatMessage,
  Consultation,
  CreateConsultationPayload,
  CreatePetPayload,
  FavoriteVet,
  LoginPayload,
  Pet,
  Prescription,
  RateConsultationPayload,
  RegisterPayload,
  Review,
  UpdatePetPayload,
  UpdateProfilePayload,
  User,
  Vet,
  VetCard,
} from '@/types';

export type SendMessagePayload = { content?: string; attachmentUrl?: string; clientMsgId?: string };

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
  sendMessage: async (consultationId: string, payload: SendMessagePayload) => {
    // clientMsgId estable: el backend deduplica por él, así que los reintentos
    // (por red inestable / offline) no crean mensajes duplicados.
    const clientMsgId = payload.clientMsgId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      return await api.post<ChatMessage>(`/consultations/${consultationId}/messages`, {
        ...payload,
        clientMsgId,
      });
    } catch (err) {
      // Red caída / offline: encolar y reintentar luego con el mismo clientMsgId.
      await enqueueMessage(consultationId, payload).catch(() => undefined);
      throw err;
    }
  },
  flushOutbox: async () => {
    const pending = await getPendingMessages();
    for (const m of pending) {
      try {
        await api.post<ChatMessage>(`/consultations/${m.consultationId}/messages`, {
          ...m.payload,
          clientMsgId: m.id,
        });
        await removeMessage(m.id);
      } catch {
        break; // mantener el resto en cola para otro intento
      }
    }
  },
  getPrescriptions: (consultationId: string) =>
    api.get<Prescription[]>(`/consultations/${consultationId}/prescriptions`),
  rate: (consultationId: string, payload: RateConsultationPayload) =>
    api.post<Review>(`/consultations/${consultationId}/rating`, payload),
};

export interface CallToken {
  url: string;
  room: string;
  token: string;
  expiresIn: number;
}

export const callsService = {
  getToken: (consultationId: string) =>
    api.post<CallToken>(`/calls/${consultationId}/token`),
};

export const usersService = {
  listVets: (params?: { search?: string; online?: boolean; minRating?: number; sortBy?: 'rating' | 'recent'; page?: number; limit?: number }) =>
    api.get<Vet[]>('/users/vets', { params }),
  getVetById: (id: string) => api.get<Vet>(`/users/vets/${id}`),
  updateMe: (payload: UpdateProfilePayload) => api.patch<User>('/users/me', payload),
  listFavorites: () => api.get<FavoriteVet[]>('/users/favorites'),
  addFavorite: (vetId: string) => api.post<{ favorited: boolean }>(`/users/vets/${vetId}/favorite`),
  removeFavorite: (vetId: string) =>
    api.delete<{ favorited: boolean }>(`/users/vets/${vetId}/favorite`),
};

export const mediaService = {
  upload: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    
    // Axios FormData is buggy on React Native, using native fetch for uploads.
    const token = await import('@/lib/secure-storage').then(m => m.secureStorage.getAccessToken());
    const apiUrl = await import('@/lib/env').then(m => m.API_URL);
    const res = await fetch(`${apiUrl}/api/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form,
    });
    
    if (!res.ok) throw new Error('Upload failed');
    const json = await res.json();
    return json.data as Attachment;
  },
};

export const notificationsService = {
  registerToken: (token: string, platform: 'android' | 'ios' | 'web') =>
    api.post('/notifications/token', { token, platform }),
  list: () => api.get<{ items: AppNotification[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};
