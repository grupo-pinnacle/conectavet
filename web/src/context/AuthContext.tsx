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
    return {
      id: payload.sub || payload.id || "",
      name: payload.name || "",
      email: payload.email || "",
      role: payload.role || "owner",
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { accessToken, user: userData } = res.data.data;
    setAuth(accessToken, userData);
  }, [setAuth]);

  const register = useCallback(async (name: string, email: string, password: string, role: string) => {
    const res = await api.post("/api/auth/register", { name, email, password, role });
    const { accessToken, user: userData } = res.data.data;
    setAuth(accessToken, userData);
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
