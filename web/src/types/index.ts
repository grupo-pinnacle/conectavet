export interface User {
  id: string;
  name: string;
  email: string;
  role?: "owner" | "vet" | "admin";
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: string;
  ownerId: string;
  ownerName?: string;
  avatar?: string;
  nextVet?: string;
  lastVisit?: string;
  createdAt?: string;
}

export interface Consultation {
  id: string;
  petId: string;
  petName?: string;
  ownerId?: string;
  ownerName?: string;
  vetId: string;
  vetName?: string;
  type: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  date: string;
  time: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName?: string;
  vetId: string;
  vetName?: string;
  date: string;
  type: string;
  diagnosis: string;
  treatment: string;
  notes: string;
}


