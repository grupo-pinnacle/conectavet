import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from './secure-storage';
import { ApiError, type AuthResponse } from '@/types';
import { API_URL } from './env';

/**
 * Axios instance for the VetConnect backend (Express + Prisma).
 *
 * Mobile-specific auth scheme:
 *  - `accessToken` is attached to every request as `Authorization: Bearer …`.
 *  - When the backend replies 401, the interceptor transparently tries
 *    `POST /api/auth/refresh` sending the `refreshToken` in the body
 *    (NOT as a cookie — see INTEGRATION.md §3 for the deviation rationale).
 *  - If refresh fails, the user is logged out and redirected to login.
 */
export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': 'mobile',
  },
});

// ── Request interceptor: attach access token ───────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ── Response interceptor: unwrap envelope + handle 401 refresh ─────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => {
    // Backend always returns { status, data, pagination? }.
    // Unwrap to the inner `data` so service-layer calls return typed payloads
    // (e.g. `api.get<Pet>('/pets/123')` resolves to a `Pet`, not the envelope).
    const envelope = response.data;
    if (envelope && typeof envelope === 'object' && ('status' in envelope || 'success' in envelope) && 'data' in envelope) {
      const result = envelope.data as unknown;
      if (envelope.pagination && Array.isArray(result)) {
        (result as unknown as { pagination?: typeof envelope.pagination }).pagination =
          envelope.pagination;
      }
      return result;
    }
    return envelope;
  },
  async (error: AxiosError<{ status: string; code?: string; message?: string; details?: unknown }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // 401 → try to refresh once, then replay original request
    if (status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh finishes
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            original.headers.set('Authorization', `Bearer ${newToken}`);
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const authData = await api.post<AuthResponse>(
          '/auth/refresh',
          { refreshToken, platform: 'mobile' }
        );

        await secureStorage.setAccessToken(authData.accessToken);
        if (authData.refreshToken) {
          await secureStorage.setRefreshToken(authData.refreshToken);
        }

        onTokenRefreshed(authData.accessToken);
        original.headers.set('Authorization', `Bearer ${authData.accessToken}`);
        return api(original);
      } catch {
        onTokenRefreshed(null);
        // Hard logout — surface to the auth store via event emitter
        await secureStorage.clearAll();
        // The auth store listens for this and redirects to login
        require('@/stores/authStore').useAuthStore.getState().handleSessionExpired();
        return Promise.reject(
          new ApiError('Sesión expirada', 'SESSION_EXPIRED', 401)
        );
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize backend error envelope → ApiError
    const body = error.response?.data;
    const message = body?.message ?? error.message ?? 'Error inesperado';
    const code = body?.code ?? 'UNKNOWN';
    return Promise.reject(new ApiError(message, code, status ?? 0, body?.details));
  }
);

export default api;
