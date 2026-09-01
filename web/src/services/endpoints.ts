import api from "./api";
import type { User, Pet, Consultation, Message, Prescription, VetCard } from "../types";

export async function getMe(): Promise<User> {
  const res = await api.get("/api/users/me");
  return res.data.data;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<User> {
  const res = await api.patch("/api/users/me", data);
  return res.data.data;
}

export async function updateAvailability(isOnline: boolean): Promise<User> {
  const res = await api.patch("/api/users/me/availability", { isOnline });
  return res.data.data;
}

export async function getMyPets(): Promise<Pet[]> {
  const res = await api.get("/api/pets");
  return res.data.data;
}

export async function getAllPets(): Promise<Pet[]> {
  const res = await api.get("/api/pets");
  return res.data.data;
}

export async function getPetById(id: string): Promise<Pet> {
  const res = await api.get(`/api/pets/${id}`);
  return res.data.data;
}

export async function createPet(data: Partial<Pet>): Promise<Pet> {
  const res = await api.post("/api/pets", data);
  return res.data.data;
}

export async function getManagedPets(): Promise<Pet[]> {
  const res = await api.get("/api/pets/managed");
  return res.data.data;
}

export async function updatePet(id: string, data: Partial<Pet>): Promise<Pet> {
  const res = await api.put(`/api/pets/${id}`, data);
  return res.data.data;
}

export async function getMyConsultations(): Promise<Consultation[]> {
  const res = await api.get("/api/consultations/mine");
  return res.data.data;
}

export async function getConsultationById(id: string): Promise<Consultation> {
  const res = await api.get(`/api/consultations/${id}`);
  return res.data.data;
}

export async function createConsultation(data: { petId: string; notes?: string; vetId?: string }): Promise<Consultation> {
  const res = await api.post("/api/consultations", data);
  return res.data.data;
}

export async function assignConsultation(id: string): Promise<Consultation> {
  const res = await api.patch(`/api/consultations/${id}/assign`);
  return res.data.data;
}

export async function declineConsultation(id: string): Promise<Consultation> {
  const res = await api.patch(`/api/consultations/${id}/decline`);
  return res.data.data;
}

export async function cancelConsultation(id: string): Promise<Consultation> {
  const res = await api.patch(`/api/consultations/${id}/cancel`);
  return res.data.data;
}

export async function completeConsultation(id: string, notes?: string): Promise<Consultation> {
  const res = await api.patch(`/api/consultations/${id}/complete`, { notes });
  return res.data.data;
}

export async function getMessages(id: string): Promise<Message[]> {
  const res = await api.get(`/api/consultations/${id}/messages`);
  return res.data.data;
}

export async function sendMessage(id: string, content: string): Promise<Message> {
  // clientMsgId estable para dedup: si el POST se reintenta (error de red antes
  // de la respuesta) enviamos el mismo id y el backend descarta el duplicado (P3-6).
  const clientMsgId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const res = await api.post(`/api/consultations/${id}/messages`, { content, clientMsgId });
  return res.data.data;
}

export async function getPrescriptions(id: string): Promise<Prescription[]> {
  const res = await api.get(`/api/consultations/${id}/prescriptions`);
  return res.data.data;
}

export interface PrescriptionInput {
  content: string;
  medication?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: string;
  indications?: string;
}

export async function createPrescription(id: string, data: PrescriptionInput | string): Promise<Prescription> {
  const payload = typeof data === "string" ? { content: data } : data;
  const res = await api.post(`/api/consultations/${id}/prescriptions`, payload);
  return res.data.data;
}

export interface VetFilters {
  search?: string;
  onlineOnly?: boolean;
  minRating?: number;
  sortBy?: "rating" | "recent";
}

export interface VetSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  isOnline: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  isFavorite: boolean;
}

export async function listVets(filters: VetFilters = {}): Promise<VetSummary[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.onlineOnly) params.online = "true";
  if (filters.minRating && filters.minRating > 0) params.minRating = String(filters.minRating);
  params.sortBy = filters.sortBy ?? "recent";
  const res = await api.get("/api/users/vets", { params });
  return res.data.data;
}

export async function getVetById(id: string) {
  const res = await api.get(`/api/users/vets/${id}`);
  return res.data.data;
}

export async function addFavorite(vetId: string) {
  const res = await api.post(`/api/users/vets/${vetId}/favorite`);
  return res.data.data;
}

export async function removeFavorite(vetId: string) {
  const res = await api.delete(`/api/users/vets/${vetId}/favorite`);
  return res.data.data;
}

export async function getPetVetCard(id: string): Promise<VetCard> {
  const res = await api.get(`/api/pets/${id}/vetcard`);
  return res.data.data;
}

export interface CallToken {
  url: string;
  room: string;
  token: string;
  expiresIn: number;
}

export async function getCallToken(consultationId: string): Promise<CallToken> {
  const res = await api.post(`/api/calls/${consultationId}/token`);
  return res.data.data;
}

export interface RateConsultationPayload {
  rating: number;
  comment: string;
}

export async function rateConsultation(consultationId: string, payload: RateConsultationPayload): Promise<any> {
  const res = await api.post(`/api/consultations/${consultationId}/rating`, payload);
  return res.data.data;
}

// â”€â”€â”€ Admin endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CLIENT' | 'VET' | 'ADMIN';
  vetStatus: 'PENDING' | 'APPROVED' | null;
  isOnline: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  specialty: string | null;
}

export interface AdminUserList {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  totalVets: number;
  totalClients: number;
  pendingVets: number;
  totalConsultations: number;
  completedConsultations: number;
}

export async function adminListUsers(page = 1, limit = 30, search?: string, role?: string): Promise<AdminUserList> {
  const params: Record<string, string> = { page: String(page), limit: String(limit) };
  if (search) params.search = search;
  if (role) params.role = role;
  const res = await api.get('/api/users/admin/users', { params });
  return res.data.data;
}

export async function adminGetStats(): Promise<AdminStats> {
  const res = await api.get('/api/users/admin/stats');
  return res.data.data;
}

export async function adminUpdateVetStatus(vetId: string, vetStatus: 'APPROVED' | 'PENDING'): Promise<AdminUser> {
  const res = await api.patch(`/api/users/vets/${vetId}/vet-status`, { vetStatus });
  return res.data.data;
}

export async function adminBatchDeleteUsers(userIds: string[]) {
  const res = await api.delete('/api/users/admin/users/batch', { data: { userIds } });
  return res.data;
}

