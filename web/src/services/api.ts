import axios from "axios";
import { API_CONFIG } from "../constants/api";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vetconnect_auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vetconnect_auth_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;