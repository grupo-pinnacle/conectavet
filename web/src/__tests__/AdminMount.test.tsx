import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import { adminGetStats, adminListUsers } from "../services/endpoints";
import type { AdminUser } from "../services/endpoints";

vi.mock("../services/endpoints", () => ({
  adminGetStats: vi.fn(),
  adminListUsers: vi.fn(),
  adminUpdateVetStatus: vi.fn(),
  adminBatchDeleteUsers: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@test.com", role: "admin", firstName: "Admin" },
    logout: vi.fn(),
  }),
}));

const mockedStats = vi.mocked(adminGetStats);
const mockedUsers = vi.mocked(adminListUsers);

const STATS = {
  totalUsers: 10,
  totalVets: 3,
  totalClients: 6,
  pendingVets: 1,
  totalConsultations: 5,
  completedConsultations: 2,
};

const ADMIN_ROW: AdminUser = {
  id: "admin-1",
  email: "admin@test.com",
  firstName: "Admin",
  lastName: null,
  role: "ADMIN",
  vetStatus: null,
  isOnline: false,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  specialty: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedStats.mockResolvedValue(STATS);
  mockedUsers.mockResolvedValue({ data: [ADMIN_ROW], total: 1, page: 1, limit: 20, totalPages: 1 });
});

describe("Reporte API — montaje del panel admin sin llamadas duplicadas", () => {
  it("montaje dispara 1× stats + 1× users (el debounce asume la carga inicial)", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    // La tabla llega vía el debounce (400ms): esperar al render y LUEGO
    // dejar pasar la ventana del debounce antes de contar. Sin esto, la
    // aserción ganaría la carrera y no detectaría el fetch duplicado.
    await screen.findByText("admin@test.com");
    await new Promise((r) => setTimeout(r, 800));

    await waitFor(() => {
      expect(mockedStats).toHaveBeenCalledTimes(1);
      expect(mockedUsers).toHaveBeenCalledTimes(1);
    });
    expect(mockedUsers).toHaveBeenCalledWith(1, 20, undefined, undefined);
  });

  it("frontera: stats y users coexisten en un solo ciclo de carga", async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Usuarios totales")).toBeInTheDocument();
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });
    expect(mockedStats).toHaveBeenCalledTimes(1);
  });
});
