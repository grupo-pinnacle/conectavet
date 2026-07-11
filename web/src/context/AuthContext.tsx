import { createContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import api from "../services/api";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
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
    const roleMap: Record<string, string> = { CLIENT: "owner", VET: "vet", ADMIN: "admin" };
    return {
      id: payload.sub || payload.id || "",
      name: payload.name || "",
      email: payload.email || "",
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

  useEffect(() => {
    const saved = localStorage.getItem("vetconnect_auth_token");
    if (saved) {
      const parsed = parseUserFromToken(saved);
      if (parsed) {
        setToken(saved);
        setUser(parsed);
      } else {
        localStorage.removeItem("vetconnect_auth_token");
      }
    }
    setIsLoading(false);
  }, []);

  const setAuth = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem("vetconnect_auth_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  function normalizeUser(u: any): User {
    return {
      id: u.id,
      name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
      email: u.email,
      role: ({ CLIENT: "owner", VET: "vet", ADMIN: "admin" } as Record<string, string>)[u.role] || "owner",
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

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
