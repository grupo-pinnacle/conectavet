import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import api from "../services/api";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vetconnect_auth_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.get("/api/users/me")
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem("vetconnect_auth_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem("vetconnect_auth_token", newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, password: string, role: string) => {
    const res = await api.post("/api/auth/register", { email, password, role });
    setUser(res.data.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("vetconnect_auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
