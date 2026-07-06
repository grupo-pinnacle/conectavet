import { createContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user] = useState<User | null>(null);
  const [token] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log("Login:", email, password);
  };

<<<<<<< HEAD
  const logout = () => {
    console.log("Logout");
  };

  const isAuthenticated = !!token;
=======
  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { accessToken, user: userData } = res.data.data;
    localStorage.setItem("vetconnect_auth_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, password: string, role: string) => {
    const res = await api.post("/api/auth/register", { email, password, role });
    const { accessToken, user: userData } = res.data.data;
    localStorage.setItem("vetconnect_auth_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("vetconnect_auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;
>>>>>>> 01988924b24fffd102ad957855769aa50643cffd

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}