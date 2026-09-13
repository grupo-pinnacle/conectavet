import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VetMessagesSection from "../components/dashboard/vet/VetMessagesSection";
import { useConsultations } from "../hooks/useConsultations";
import type { Consultation } from "../types";

vi.mock("../hooks/useConsultations", () => ({
  useConsultations: vi.fn(),
  useInvalidateConsultations: vi.fn(() => vi.fn()),
  consultationsKey: vi.fn(() => ["consultations", "vet"]),
}));

vi.mock("../hooks/useChatSocket", () => ({
  useChatSocket: vi.fn(() => ({ socketConnected: true })),
}));

vi.mock("../services/socket", () => ({
  joinConsultation: vi.fn(),
  connectSocket: vi.fn().mockResolvedValue({
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

vi.mock("../services/endpoints", () => ({
  assignConsultation: vi.fn(),
  declineConsultation: vi.fn(),
  completeConsultation: vi.fn(),
  getMessages: vi.fn().mockResolvedValue([]),
  sendMessage: vi.fn(),
  getPrescriptions: vi.fn().mockResolvedValue([]),
  createPrescription: vi.fn(),
}));

vi.mock("../services/chatStore", () => ({
  getCachedConsultations: vi.fn(() => undefined),
  updateCachedConsultation: vi.fn(),
  getCachedMessages: vi.fn(() => []),
  getCachedPrescriptions: vi.fn(() => []),
  setCachedMessages: vi.fn(),
  setCachedPrescriptions: vi.fn(),
  confirmMessage: vi.fn(),
  applyMessageEcho: vi.fn(),
  upsertPrescription: vi.fn(),
  getLastConsultationId: vi.fn(() => null),
  setLastConsultationId: vi.fn(),
}));

const mockedUseConsultations = vi.mocked(useConsultations);

function makeOffer(id: string, petName: string): Consultation {
  return {
    id,
    clientId: `client-${id}`,
    petId: `pet-${id}`,
    vetId: "vet-1",
    status: "PENDING",
    notes: `Motivo de consulta para ${petName}`,
    createdAt: new Date("2026-02-01T12:00:00Z").toISOString(),
    pet: { id: `pet-${id}`, name: petName, species: "Perro", ownerId: `client-${id}` },
    client: { id: `client-${id}`, firstName: `Dueño de ${petName}`, email: `client${id}@test.com` },
  } as unknown as Consultation;
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("BUG-002 Web — Deduplicación de 5 ofertas en panel veterinario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza exactamente 5 ofertas únicas y el contador indica 5", async () => {
    const fiveOffers = [
      makeOffer("c-1", "Milo"),
      makeOffer("c-2", "Luna"),
      makeOffer("c-3", "Rocky"),
      makeOffer("c-4", "Simba"),
      makeOffer("c-5", "Bella"),
    ];

    mockedUseConsultations.mockReturnValue({
      data: fiveOffers,
      isLoading: false,
    } as any);

    renderWithClient(<VetMessagesSection />);

    await waitFor(() => {
      // Contador en botón de la pestaña
      expect(screen.getByRole("button", { name: /Pendientes \(5\)/i })).toBeInTheDocument();
      // Verificamos que cada mascota aparezca una sola vez
      expect(screen.getByText("Milo")).toBeInTheDocument();
      expect(screen.getByText("Luna")).toBeInTheDocument();
      expect(screen.getByText("Rocky")).toBeInTheDocument();
      expect(screen.getByText("Simba")).toBeInTheDocument();
      expect(screen.getByText("Bella")).toBeInTheDocument();
    });

    // Validamos que la cantidad de badges "Oferta" sea exactamente 5
    const offerBadges = screen.getAllByText(/Oferta/i);
    const cardBadges = offerBadges.filter((el) => el.tagName.toLowerCase() === "span");
    expect(cardBadges).toHaveLength(5);
  });

  it("deduplica si el array de consultas contiene elementos repetidos por ráfagas de socket o red", async () => {
    // Simulamos que por ráfagas concurrentes de socket (consultation:new + notification:new)
    // el array contiene ofertas repetidas
    const duplicatedOffers = [
      makeOffer("c-1", "Milo"),
      makeOffer("c-1", "Milo"), // duplicado
      makeOffer("c-2", "Luna"),
      makeOffer("c-3", "Rocky"),
      makeOffer("c-3", "Rocky"), // duplicado
      makeOffer("c-4", "Simba"),
      makeOffer("c-5", "Bella"),
    ];

    mockedUseConsultations.mockReturnValue({
      data: duplicatedOffers,
      isLoading: false,
    } as any);

    renderWithClient(<VetMessagesSection />);

    await waitFor(() => {
      // Aunque lleguen 7 items (2 duplicados), la UI debe mostrar exactamente 5
      expect(screen.getByRole("button", { name: /Pendientes \(5\)/i })).toBeInTheDocument();
      expect(screen.getAllByText("Milo")).toHaveLength(1);
      expect(screen.getAllByText("Rocky")).toHaveLength(1);
    });

    const offerBadges = screen.getAllByText(/Oferta/i);
    const cardBadges = offerBadges.filter((el) => el.tagName.toLowerCase() === "span");
    expect(cardBadges).toHaveLength(5);
  });
});
