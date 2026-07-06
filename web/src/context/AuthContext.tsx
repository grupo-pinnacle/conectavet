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

  const logout = () => {
    console.log("Logout");
  };

  const isAuthenticated = !!token;

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