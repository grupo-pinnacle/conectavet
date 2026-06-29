import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  role: "CLIENT" | "VET" | "ADMIN";
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;

  const logout = useCallback(() => {
    localStorage.removeItem("vetconnect_auth_token");
    setUser(null);
    setToken(null);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem("vetconnect_auth_token", newToken);
      setToken(newToken);
      setUser(userData);
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al iniciar sesión";
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      await api.post("/api/auth/register", { email, password, role });
      await login(email, password);
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al registrarse";
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("vetconnect_auth_token");
    if (savedToken) {
      setToken(savedToken);
      api
        .get("/api/users/me")
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem("vetconnect_auth_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

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
