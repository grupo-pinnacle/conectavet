import type { AxiosRequestConfig } from 'axios';

/**
 * Module augmentation — the response interceptor in `src/lib/api.ts` unwraps
 * the `{ status, data, pagination? }` envelope and returns the inner `data`
 * directly. These overrides make TypeScript aware of that contract so
 * `api.get<Pet>('/pets/123')` is typed as `Promise<Pet>`, not
 * `Promise<AxiosResponse<Pet>>`.
 */
declare module 'axios' {
  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  }
}
