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
    // El JWT vive en cookie HttpOnly (seteada por el backend). Hidratamos
    // llamando a /auth/me, que usa la cookie; si no hay sesión devuelve 401.
    getMe()
      .then((userData) => {
        setUser(normalizeUser(userData));
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      });
  }, []);

  const setAuth = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  function normalizeUser(u: unknown): User {
    const user = u as Partial<User> & { phone?: string };
    const roleMap: Record<string, "owner" | "vet" | "admin"> = {
        CLIENT: "owner",
        VET: "vet",
        ADMIN: "admin",
    };

    return {
      id: user.id ?? "",
      name: user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "",
      email: user.email || "",
      // Si user.phone tiene valor, se incluye. Si no, se omite completamente del objeto
      ...(user.phone ? { phone: user.phone } : {}),
      isOnline: typeof user.isOnline === "boolean" ? user.isOnline : false,
      role: roleMap[user.role as string] || "owner",
    };
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { user: userData } = res.data.data;
    setAuth(normalizeUser(userData));
  }, [setAuth]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const [firstName, ...rest] = name.trim().split(" ");
    const roleMap: Record<string, string> = { owner: "CLIENT", vet: "VET" };
    const res = await api.post("/api/auth/register", { firstName, lastName: rest.join(" ") || undefined, email, password, role: roleMap[role] || role });
    const { user: userData } = res.data.data;
    setAuth(normalizeUser(userData));
  }, [setAuth]);

  const logout = useCallback(async () => {
    // El backend invalida el tokenVersion y limpia las cookies HttpOnly.
    await api.post("/api/auth/logout").catch(() => {});
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

  const isAuthenticated = !!user;

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
