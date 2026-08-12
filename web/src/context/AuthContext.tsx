import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import api from "../services/api";
import { getMe, updateAvailability } from "../services/endpoints";
import { disconnectSocket } from "../services/socket";
import { clearChatStore } from "../services/chatStore";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  setOnline: (isOnline: boolean) => Promise<void>;
  isOnline: boolean;
  onlineLoading: boolean;
  onlineError: string | null;
  syncOnline: (isOnline: boolean) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  const isOnline = !!user?.isOnline;

  useEffect(() => {
    const saved = localStorage.getItem("vetconnect_auth_token");
    if (!saved) {
      setIsLoading(false);
      return;
    }
    setToken(saved);
    getMe()
      .then((userData) => {
        setUser(normalizeUser(userData));
        setIsLoading(false);
      })
      .catch((err: any) => {
        // No confiamos en el token si /auth/me lo rechaza (expirado/corrupto):
        // no derivamos el usuario del payload sin verificar firma.
        if (err?.response?.status === 401) {
          localStorage.removeItem("vetconnect_auth_token");
          localStorage.removeItem("vetconnect_refresh_token");
          setUser(null);
          setToken(null);
        }
        setIsLoading(false);
      });
  }, []);

  const setAuth = useCallback((accessToken: string, userData: User, refreshToken?: string) => {
    localStorage.setItem("vetconnect_auth_token", accessToken);
    if (refreshToken) localStorage.setItem("vetconnect_refresh_token", refreshToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  function normalizeUser(u: any): User {
    const roleMap: Record<string, "owner" | "vet" | "admin"> = { 
        CLIENT: "owner", 
        VET: "vet", 
        ADMIN: "admin" 
    };
    
    return {
      id: u.id,
      name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      email: u.email,
      // Si u.phone tiene valor, se incluye. Si no, se omite completamente del objeto
      ...(u.phone ? { phone: u.phone } : {}),
      isOnline: typeof u.isOnline === "boolean" ? u.isOnline : false,
      // Se añade 'as string' para evitar errores en modo strict
      role: roleMap[u.role as string] || "owner",
    };
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    setAuth(accessToken, normalizeUser(userData), refreshToken);
  }, [setAuth]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const [firstName, ...rest] = name.trim().split(" ");
    const roleMap: Record<string, string> = { owner: "CLIENT", vet: "VET" };
    const res = await api.post("/api/auth/register", { firstName, lastName: rest.join(" ") || undefined, email, password, role: roleMap[role] || role });
    const { accessToken, refreshToken, user: userData } = res.data.data;
    setAuth(accessToken, normalizeUser(userData), refreshToken);
  }, [setAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem("vetconnect_auth_token");
    localStorage.removeItem("vetconnect_refresh_token");
    disconnectSocket();
    clearChatStore();
    setToken(null);
    setUser(null);
  }, []);

  const setOnline = useCallback(async (value: boolean) => {
    setOnlineError(null);
    setOnlineLoading(true);
    try {
      const updated = await updateAvailability(value);
      setUser((prev) =>
        prev
          ? { ...prev, isOnline: typeof updated.isOnline === "boolean" ? updated.isOnline : prev.isOnline }
          : prev
      );
    } catch {
      setOnlineError("No pudimos cambiar tu disponibilidad. Revisá tu conexión.");
    } finally {
      setOnlineLoading(false);
    }
  }, []);

  const syncOnline = useCallback((isOnline: boolean) => {
    setUser((prev) => (prev ? { ...prev, isOnline } : prev));
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        setOnline,
        isOnline,
        onlineLoading,
        onlineError,
        syncOnline,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
