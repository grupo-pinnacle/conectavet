import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConsultationsSection from "../components/dashboard/ConsultationsSection";
import { getMyPets, getMyConsultations, createConsultation } from "../services/endpoints";
import type { Pet, Consultation } from "../types";

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
const mockedCreate = vi.mocked(createConsultation);

const ANDY = { id: "pet-1", name: "Andy", species: "Perro", ownerId: "client-1" } as Pet;

function apiError(status: number, message: string) {
  return { response: { status, data: { message } } };
}

function newConsultation(): Consultation {
  return {
    id: "c-1",
    clientId: "client-1",
    petId: "pet-1",
    status: "WAITING",
    createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
    pet: { id: "pet-1", name: "Andy" },
  } as Consultation;
}

async function fillAndSubmit() {
  render(<ConsultationsSection />);
  await screen.findByText("Solicitar nueva consulta");
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "pet-1" },
  });
  fireEvent.change(screen.getByPlaceholderText(/mi perro no quiere comer/i), {
    target: { value: "Texto de prueba" },
  });
  fireEvent.click(screen.getByText("Ingresar a la sala de consulta"));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPets.mockResolvedValue([ANDY]);
  mockedCons.mockResolvedValue([]);
});

describe("BUG-03 Cerco — solicitar consulta", () => {
  it("caso feliz: crea, muestra éxito y agrega a 'en curso'", async () => {
    mockedCreate.mockResolvedValue(newConsultation());
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/consulta solicitada/i)).toBeInTheDocument();
      expect(screen.getByText("Andy")).toBeInTheDocument();
    });
  });

  it("borde H1: doble click rápido genera un solo POST (guarda creating)", async () => {
    mockedCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(newConsultation()), 50))
    );
    render(<ConsultationsSection />);
    await screen.findByText("Solicitar nueva consulta");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "pet-1" } });
    fireEvent.change(screen.getByPlaceholderText(/mi perro no quiere comer/i), {
      target: { value: "Texto de prueba" },
    });
    const btn = screen.getByText("Ingresar a la sala de consulta");
    fireEvent.click(btn);
    fireEvent.click(btn);

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("borde 409: muestra el mensaje real y recarga la lista (la consulta sí existe)", async () => {
    mockedCreate.mockRejectedValue(apiError(409, "Ya tenés una consulta activa o en espera para esta mascota"));
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/ya tenés una consulta activa/i)).toBeInTheDocument();
      // Recarga tras 409: carga inicial + resync
      expect(mockedCons.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("inválido 400: muestra el detalle de validación en vez del genérico", async () => {
    mockedCreate.mockRejectedValue(apiError(400, "Describí el motivo de la consulta (mín. 5 caracteres)"));
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/mín\. 5 caracteres/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Error al crear la consulta")).not.toBeInTheDocument();
  });

  it("borde red caída: conserva el genérico como fallback", async () => {
    mockedCreate.mockRejectedValue(new Error("Network Error"));
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("Error al crear la consulta")).toBeInTheDocument();
    });
  });
});

describe("BUG-03 Frontera — contrato UI → endpoints → REST", () => {
  it("envía {petId, notes recortado} sin vetId (ruta POST /api/consultations)", async () => {
    mockedCreate.mockResolvedValue(newConsultation());
    await fillAndSubmit();

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    expect(mockedCreate).toHaveBeenCalledWith({ petId: "pet-1", notes: "Texto de prueba" });
  });
});
