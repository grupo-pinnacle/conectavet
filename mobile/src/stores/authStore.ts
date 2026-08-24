import { create } from 'zustand';
import { secureStorage } from '@/lib/secure-storage';
import { disconnectSocket } from '@/lib/socket';
import api from '@/lib/api';
import { ApiError } from '@/types';
import type { User, AuthResponse, LoginPayload, RegisterPayload } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  sessionExpired: boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  handleSessionExpired: () => void;
  clearSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  sessionExpired: false,

  async hydrate() {
    const [token, user] = await Promise.all([
      secureStorage.getAccessToken(),
      secureStorage.getUser<User>(),
    ]);
    if (!token) {
      set({ isHydrated: true });
      return;
    }
    // Validar el token contra el backend; si fue revocado/expiró (401),
    // limpiamos el storage y dejamos la sesión cerrada.
    try {
      const me = await api.get<{ user: User }>('/auth/me');
      set({ user: me.user, isAuthenticated: true, isHydrated: true });
    } catch (e) {
      // El interceptor normaliza el error de la API en ApiError (con .status),
      // no en un AxiosError con .response.status. Por eso chequeamos la instancia.
      if (e instanceof ApiError && e.status === 401) {
        await secureStorage.clearAll();
        set({ user: null, isAuthenticated: false });
      }
      set({ isHydrated: true });
    }
  },

  async login(payload) {
    set({ isLoading: true });
    try {
      const data = await api.post<AuthResponse>('/auth/login', {
        ...payload,
        platform: 'mobile',
      });
      await secureStorage.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await secureStorage.setRefreshToken(data.refreshToken);
      }
      await secureStorage.setUser(data.user);
      set({ user: data.user, isAuthenticated: true, sessionExpired: false });
    } finally {
      set({ isLoading: false });
    }
  },

  async register(payload) {
    set({ isLoading: true });
    try {
      const data = await api.post<AuthResponse>('/auth/register', {
        ...payload,
        platform: 'mobile',
      });
      await secureStorage.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await secureStorage.setRefreshToken(data.refreshToken);
      }
      await secureStorage.setUser(data.user);
      set({ user: data.user, isAuthenticated: true, sessionExpired: false });
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken, platform: 'mobile' }).catch(() => {});
      }
    } finally {
      await secureStorage.clearAll();
      disconnectSocket();
      set({ user: null, isAuthenticated: false });
    }
  },

  async updateUser(user) {
    await secureStorage.setUser(user);
    set({ user });
  },

  handleSessionExpired() {
    disconnectSocket();
    set({ sessionExpired: true, user: null, isAuthenticated: false });
  },

  clearSessionExpired() {
    set({ sessionExpired: false });
  },
}));
