export type Role = 'CLIENT' | 'VET' | 'ADMIN';
export type VetStatus = 'PENDING' | 'APPROVED';
export type ConsultationStatus = 'WAITING' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
} as const;

export const VALID_SPECIES = [
  'Perro',
  'Gato',
  'Ave',
  'Conejo',
  'Roedor',
  'Reptil',
  'Otro',
] as const;

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor?: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: Role;
  vetStatus?: VetStatus;
  isOnline: boolean;
  specialty?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  age?: number | null;
  weightKg?: number | null;
  photoUrl?: string | null;
  ownerId: string;
  allergies?: string[];
  chronicConditions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  vetId: string;
  content: string;
  medication?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  durationDays?: string | null;
  indications?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string | null;
  clientMsgId?: string | null;
  createdAt: string;
}

export interface Consultation {
  id: string;
  clientId: string;
  vetId?: string | null;
  petId: string;
  status: ConsultationStatus;
  notes?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  pet?: Pet;
  client?: Partial<User>;
  vet?: Partial<User>;
  prescriptions?: Prescription[];
}
