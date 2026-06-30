import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://localhost:3000";

interface User {
  id: string;
  email: string;
  role: "CLIENT" | "VET" | "ADMIN";
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: true,
  isAuthenticated: false,
});

interface Props {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;

  const api = axios.create({ baseURL: API_URL, timeout: 10000 });

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("vetconnect_auth_token");
    setUser(null);
    setToken(null);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const { token: newToken, user: userData } = res.data.data;
      await AsyncStorage.setItem("vetconnect_auth_token", newToken);
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
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem("vetconnect_auth_token");
        if (savedToken) {
          setToken(savedToken);
          const res = await api.get("/api/users/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setUser(res.data.data);
        }
      } catch {
        await AsyncStorage.removeItem("vetconnect_auth_token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}
