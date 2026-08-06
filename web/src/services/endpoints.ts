import api from "./api";
import type { User, Pet, Consultation, Message, Prescription, VetCard } from "../types";

export async function getMe(): Promise<User> {
  const res = await api.get("/api/users/me");
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

export async function createConsultation(data: { petId: string; notes?: string }): Promise<Consultation> {
  const res = await api.post("/api/consultations", data);
  return res.data.data;
}

export async function assignConsultation(id: string): Promise<Consultation> {
  const res = await api.patch(`/api/consultations/${id}/assign`);
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
  const res = await api.post(`/api/consultations/${id}/messages`, { content });
  return res.data.data;
}

export async function getPrescriptions(id: string): Promise<Prescription[]> {
  const res = await api.get(`/api/consultations/${id}/prescriptions`);
  return res.data.data;
}

export async function createPrescription(id: string, content: string): Promise<Prescription> {
  const res = await api.post(`/api/consultations/${id}/prescriptions`, { content });
  return res.data.data;
}

export async function getPetVetCard(id: string): Promise<VetCard> {
  const res = await api.get(`/api/pets/${id}/vetcard`);
  return res.data.data;
}
