import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import * as useAuthHook from "../hooks/useAuth";
import type { AuthContextType } from "../context/AuthContext";

describe("ProtectedRoute — Control de Acceso y Prevención de Bucle Infinito", () => {
  it("redirige a /login si el usuario no está autenticado", () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      token: null,
      isOnline: true,
      onlineLoading: false,
      onlineError: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setOnline: vi.fn(),
      syncOnline: vi.fn(),
    };
    vi.spyOn(useAuthHook, "useAuth").mockReturnValue(mockAuth);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole={["owner"]}>
                <div>Contenido Privado</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Pantalla de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Pantalla de Login")).toBeInTheDocument();
  });

  it("permite el acceso si el rol coincide", () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: true,
      user: { id: "1", email: "tutor@test.com", role: "owner", firstName: "Tutor", lastName: "Prueba" },
      isLoading: false,
      token: "tok",
      isOnline: true,
      onlineLoading: false,
      onlineError: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setOnline: vi.fn(),
      syncOnline: vi.fn(),
    };
    vi.spyOn(useAuthHook, "useAuth").mockReturnValue(mockAuth);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole={["owner"]}>
                <div>Dashboard de Tutor</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard de Tutor")).toBeInTheDocument();
  });

  it("evita el bucle infinito: redirige a /admin si el rol es admin", () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: true,
      user: { id: "admin-1", email: "admin@conectavet.com", role: "admin", firstName: "Admin", lastName: "Sistema" },
      isLoading: false,
      token: "tok",
      isOnline: true,
      onlineLoading: false,
      onlineError: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setOnline: vi.fn(),
      syncOnline: vi.fn(),
    };
    vi.spyOn(useAuthHook, "useAuth").mockReturnValue(mockAuth);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole={["owner"]}>
                <div>Dashboard de Tutor</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<div>Portal de Administración</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Portal de Administración")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard de Tutor")).not.toBeInTheDocument();
  });
});
