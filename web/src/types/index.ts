export interface User {
  id: string;
  email: string;
  role: 'CLIENT' | 'VET' | 'ADMIN';
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
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