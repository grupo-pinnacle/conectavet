export const API_CONFIG = {
  // En dev queda vacío: el proxy de Vite redirige /api a la API. En producción
  // (SPA en hosting estático) hay que setear VITE_API_URL al origen real de la
  // API (p.ej. https://api.tudominio.com) para que las llamadas no vayan al
  // origen equivocado.
  BASE_URL: import.meta.env.VITE_API_URL ?? "",
  TIMEOUT: 20000,
};