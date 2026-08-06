export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isOnline?: boolean;
  role: "owner" | "vet" | "admin";
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  weightKg?: number;
  photoUrl?: string;
  ownerId: string;
  ownerName?: string;
  sex?: string;
  color?: string;
  microchip?: string;
  allergies?: string[];
  chronicConditions?: string[];
  birthDate?: string;
  deletedAt?: string;
  createdAt?: string;
  nextVet?: string;
  lastVisit?: string;
}

export interface Consultation {
  id: string;
  clientId: string;
  vetId?: string;
  petId: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt?: string;
  pet?: Pet;
  client?: User;
  vet?: User;
  messages?: Message[];
}

export interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
  sender?: { id: string; email: string; role: string };
}

export interface Prescription {
  id: string;
  consultationId: string;
  vetId: string;
  content: string;
  createdAt: string;
  vet?: { id: string; firstName?: string | null; lastName?: string | null };
}

export interface VetCardOwner {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface VetCardConsultation {
  id: string;
  reason: string;
  status: string;
  completedAt: string | null;
}

export interface VetCardStats {
  totalConsultations: number;
  lastConsultationDate: string | null;
  ageYears: number;
  ageMonths: number;
}

export interface VetCard {
  pet: Pet;
  owner: VetCardOwner;
  stats: VetCardStats;
  recentConsultations: VetCardConsultation[];
  allergies: string[];
  chronicConditions: string[];
}
