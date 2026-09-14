import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CallButton from "../components/call/CallButton";
import * as endpoints from "../services/endpoints";
import * as authHook from "../hooks/useAuth";

vi.mock("../services/endpoints", () => ({
  getCallToken: vi.fn(),
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/socket", () => ({
  getSocket: vi.fn(() => null),
  connectSocket: vi.fn().mockResolvedValue(null),
}));

describe("CallButton — Initiate Call & Error Path Handling", () => {
  const mockUser = {
    id: "user-1",
    email: "user@test.com",
    role: "owner" as const,
    firstName: "Juan",
    lastName: "Pérez",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      token: "mock-token",
      isOnline: true,
      onlineLoading: false,
      onlineError: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      setOnline: vi.fn(),
      syncOnline: vi.fn(),
    });
  });

  it("renderiza el botón de videollamada", () => {
    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);
    expect(screen.getByRole("button", { name: /Iniciar videollamada/i })).toBeInTheDocument();
  });

  it("muestra el mensaje de error retornado por la API cuando falla getCallToken con response.data.message", async () => {
    const apiError = {
      response: {
        data: {
          message: "La consulta ya finalizó y no permite videollamadas.",
        },
      },
    };
    vi.mocked(endpoints.getCallToken).mockRejectedValueOnce(apiError);

    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);

    const callBtn = screen.getByRole("button", { name: /Iniciar videollamada/i });
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(screen.getByText("No se pudo iniciar la llamada")).toBeInTheDocument();
      expect(screen.getByText("La consulta ya finalizó y no permite videollamadas.")).toBeInTheDocument();
    });
  });

  it("muestra el mensaje de error de un Error estándar cuando falla getCallToken", async () => {
    vi.mocked(endpoints.getCallToken).mockRejectedValueOnce(new Error("Error de conexión con LiveKit"));

    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);

    const callBtn = screen.getByRole("button", { name: /Iniciar videollamada/i });
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(screen.getByText("No se pudo iniciar la llamada")).toBeInTheDocument();
      expect(screen.getByText("Error de conexión con LiveKit")).toBeInTheDocument();
    });
  });

  it("muestra el mensaje genérico por defecto cuando getCallToken falla sin mensaje específico", async () => {
    vi.mocked(endpoints.getCallToken).mockRejectedValueOnce({});

    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);

    const callBtn = screen.getByRole("button", { name: /Iniciar videollamada/i });
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(screen.getByText("No se pudo iniciar la llamada")).toBeInTheDocument();
      expect(screen.getByText("No pudimos iniciar la llamada.")).toBeInTheDocument();
    });
  });

  it("permite descartar el banner de error al presionar el botón 'Cerrar'", async () => {
    vi.mocked(endpoints.getCallToken).mockRejectedValueOnce(new Error("Fallo temporal"));

    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);

    fireEvent.click(screen.getByRole("button", { name: /Iniciar videollamada/i }));

    await waitFor(() => {
      expect(screen.getByText("Fallo temporal")).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(closeBtn);

    expect(screen.queryByText("No se pudo iniciar la llamada")).not.toBeInTheDocument();
  });

  it("inicia la llamada correctamente en el camino feliz", async () => {
    const mockToken = {
      token: "livekit-jwt-token",
      url: "wss://livekit.example.com",
      room: "cons-123",
      expiresIn: 3600,
    };
    vi.mocked(endpoints.getCallToken).mockResolvedValueOnce(mockToken);

    render(<CallButton consultationId="cons-123" peerName="Dr. Vet" />);

    fireEvent.click(screen.getByRole("button", { name: /Iniciar videollamada/i }));

    await waitFor(() => {
      expect(endpoints.getCallToken).toHaveBeenCalledWith("cons-123");
      expect(screen.queryByText("No se pudo iniciar la llamada")).not.toBeInTheDocument();
    });
  });
});
