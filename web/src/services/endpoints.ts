import api from "./api";
import type { Pet, Consultation, MedicalRecord } from "../types";

// Pets
export async function getMyPets(): Promise<Pet[]> {
  const res = await api.get("/api/pets");
  return res.data.data;
}

export async function getAllPets(): Promise<Pet[]> {
  const res = await api.get("/api/pets/all");
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

export async function updatePet(id: string, data: Partial<Pet>): Promise<Pet> {
  const res = await api.put(`/api/pets/${id}`, data);
  return res.data.data;
}

// Consultations
export async function getMyConsultations(): Promise<Consultation[]> {
  const res = await api.get("/api/consultations");
  return res.data.data;
}

export async function getVetConsultations(): Promise<Consultation[]> {
  const res = await api.get("/api/consultations/vet");
  return res.data.data;
}

export async function createConsultation(data: Partial<Consultation>): Promise<Consultation> {
  const res = await api.post("/api/consultations", data);
  return res.data.data;
}

export async function updateConsultationStatus(id: string, status: string): Promise<Consultation> {
  const res = await api.put(`/api/consultations/${id}/status`, { status });
  return res.data.data;
}

// Medical Records
export async function getMedicalRecords(petId?: string): Promise<MedicalRecord[]> {
  const url = petId ? `/api/medical-records?petId=${petId}` : "/api/medical-records";
  const res = await api.get(url);
  return res.data.data;
}

export async function createMedicalRecord(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
  const res = await api.post("/api/medical-records", data);
  return res.data.data;
}


