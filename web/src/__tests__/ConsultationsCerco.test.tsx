import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ConsultationsSection from "../components/dashboard/ConsultationsSection";
import { getMyPets, getMyConsultations } from "../services/endpoints";
import type { Consultation } from "../types";

vi.mock("../services/endpoints", () => ({
  createConsultation: vi.fn(),
  getMyPets: vi.fn(),
  getMyConsultations: vi.fn(),
}));

vi.mock("../services/realtime", () => ({
  onDataChanged: vi.fn(() => () => {}),
  notifyDataChanged: vi.fn(),
}));

const mockedPets = vi.mocked(getMyPets);
const mockedCons = vi.mocked(getMyConsultations);

function makeConsultation(id: string, status: Consultation["status"], petName: string): Consultation {
  return {
    id,
    clientId: "client-1",
    petId: `pet-${id}`,
    status,
    createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
    pet: { id: `pet-${id}`, name: petName, species: "Perro", ownerId: "client-1" },
  } as Consultation;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPets.mockResolvedValue([]);
});

describe("BUG-01 Cerco — ConsultationsSection filtra CANCELLED", () => {
  it("caso feliz: muestra ACTIVE, PENDING y WAITING en 'Tus consultas en curso'", async () => {
    mockedCons.mockResolvedValue([
      makeConsultation("c-active", "ACTIVE", "Firulais"),
      makeConsultation("c-pending", "PENDING", "Mishi"),
      makeConsultation("c-waiting", "WAITING", "Rocky"),
    ]);

    render(<ConsultationsSection />);

    await waitFor(() => {
      expect(screen.getByText("Firulais")).toBeInTheDocument();
      expect(screen.getByText("Mishi")).toBeInTheDocument();
      expect(screen.getByText("Rocky")).toBeInTheDocument();
    });
  });

  it("borde BUG-01: una consulta CANCELLED no aparece aunque el backend la devuelva", async () => {
    mockedCons.mockResolvedValue([
      makeConsultation("c-active", "ACTIVE", "Firulais"),
      makeConsultation("c-cancelled", "CANCELLED", "Cancelado"),
    ]);

    render(<ConsultationsSection />);

    await waitFor(() => {
      expect(screen.getByText("Firulais")).toBeInTheDocument();
    });
    expect(screen.queryByText("Cancelado")).not.toBeInTheDocument();
  });

  it("borde: COMPLETED tampoco aparece en curso", async () => {
    mockedCons.mockResolvedValue([
      makeConsultation("c-active", "ACTIVE", "Firulais"),
      makeConsultation("c-done", "COMPLETED", "Terminado"),
    ]);

    render(<ConsultationsSection />);

    await waitFor(() => {
      expect(screen.getByText("Firulais")).toBeInTheDocument();
    });
    expect(screen.queryByText("Terminado")).not.toBeInTheDocument();
  });

  it("caso vacío: solo CANCELLED/COMPLETED muestra el estado sin consultas activas", async () => {
    mockedCons.mockResolvedValue([
      makeConsultation("c-cancelled", "CANCELLED", "Cancelado"),
      makeConsultation("c-done", "COMPLETED", "Terminado"),
    ]);

    render(<ConsultationsSection />);

    await waitFor(() => {
      expect(screen.getByText("No tenés consultas activas en este momento")).toBeInTheDocument();
    });
  });

  it("frontera: invariante idéntica a MessagesSection/HomeSection", async () => {
    const dataset = (["ACTIVE", "PENDING", "WAITING", "COMPLETED", "CANCELLED"] as const).map((s, i) =>
      makeConsultation(`c-${i}`, s, `Pet-${s}`)
    );
    mockedCons.mockResolvedValue(dataset);
    render(<ConsultationsSection />);

    // Predicado de MessagesSection.tsx:424 y HomeSection.tsx:26 combinados:
    // vivo = ACTIVE|PENDING|WAITING  ==  NOT (COMPLETED|CANCELLED)
    const liveByContract = dataset.filter((c) => c.status !== "COMPLETED" && c.status !== "CANCELLED");
    expect(liveByContract.map((c) => c.status).sort()).toEqual(["ACTIVE", "PENDING", "WAITING"]);

    for (const c of liveByContract) {
      await waitFor(() => {
        expect(screen.getByText(`Pet-${c.status}`)).toBeInTheDocument();
      });
    }
    expect(screen.queryByText("Pet-COMPLETED")).not.toBeInTheDocument();
    expect(screen.queryByText("Pet-CANCELLED")).not.toBeInTheDocument();
  });
});
