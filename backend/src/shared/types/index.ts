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
