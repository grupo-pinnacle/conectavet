import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import api from "../services/api";
import { getMe, updateAvailability } from "../services/endpoints";

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

function parseUserFromToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roleMap: Record<string, "owner" | "vet" | "admin"> = { CLIENT: "owner", VET: "vet", ADMIN: "admin" };
    return {
      id: payload.sub || payload.id || payload.userId || "",
      name: payload.name || payload.firstName || payload.email?.split("@")[0] || "",
      email: payload.email || "",
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: roleMap[payload.role] || "owner",
    };
  } catch {
    return null;
  }
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
      .catch(() => {
        const parsed = parseUserFromToken(saved);
        if (parsed) {
          setUser(parsed);
        } else {
          localStorage.removeItem("vetconnect_auth_token");
        }
        setIsLoading(false);
      });
  }, []);

  const setAuth = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem("vetconnect_auth_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  function normalizeUser(u: any): User {
    const roleMap: Record<string, "owner" | "vet" | "admin"> = { CLIENT: "owner", VET: "vet", ADMIN: "admin" };
    return {
      id: u.id,
      name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      email: u.email,
      phone: u.phone || undefined,
      isOnline: typeof u.isOnline === "boolean" ? u.isOnline : false,
      role: roleMap[u.role] || "owner",
    };
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { accessToken, user: userData } = res.data.data;
    setAuth(accessToken, normalizeUser(userData));
  }, [setAuth]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const [firstName, ...rest] = name.trim().split(" ");
    const roleMap: Record<string, string> = { owner: "CLIENT", vet: "VET" };
    const res = await api.post("/api/auth/register", { firstName, lastName: rest.join(" ") || undefined, email, password, role: roleMap[role] || role });
    const { accessToken, user: userData } = res.data.data;
    setAuth(accessToken, normalizeUser(userData));
  }, [setAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem("vetconnect_auth_token");
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
