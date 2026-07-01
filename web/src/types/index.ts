export type { User, Pet, ApiResponse, JwtPayload, Role } from '@conectavet/shared';

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}
