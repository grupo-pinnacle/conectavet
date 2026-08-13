import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_CONFIG } from "../constants/api";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  // El JWT viaja en cookie HttpOnly (la setea el backend en /login, /register y
  // /refresh). No lo exponemos a JS ni lo enviamos en el header Authorization.
  withCredentials: true,
});

// ── Refresh de access token ante un 401 ─────────────────────────────────────
// El backend emite access (7d) + refresh (30d). En lugar de desloguar al
// expirar el access, intentamos un /auth/refresh una sola vez y reenviamos
// la request original. Si el refresh falla, limpiamos y mandamos a login.
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function subscribe(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribe((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            original.headers.set("Authorization", `Bearer ${newToken}`);
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // El refresh token vive en cookie HttpOnly; el backend lo lee de ahí.
        const { data } = await axios.post(
          `${API_CONFIG.BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );

        const accessToken: string = data.data.accessToken;

        onTokenRefreshed(accessToken);
        original.headers.set("Authorization", `Bearer ${accessToken}`);
        return api(original);
      } catch {
        onTokenRefreshed(null);
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
