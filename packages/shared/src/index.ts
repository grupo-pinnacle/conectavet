export type Role = 'CLIENT' | 'VET' | 'ADMIN';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
