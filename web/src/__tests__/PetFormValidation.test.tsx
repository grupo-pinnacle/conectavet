import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PetsSection from "../components/dashboard/PetsSection";
import { getMyPets, createPet } from "../services/endpoints";
import type { Pet } from "../types";

vi.mock("../services/endpoints", () => ({
  getMyPets: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  getPetById: vi.fn(),
  deletePet: vi.fn(),
}));

const mockedPets = vi.mocked(getMyPets);
const mockedCreate = vi.mocked(createPet);

const ANDY = { id: "pet-1", name: "Andy", species: "Perro", ownerId: "client-1" } as Pet;

async function openNewForm() {
  render(<PetsSection />);
  await screen.findByText("+ Agregar mascota");
  fireEvent.click(screen.getByText("+ Agregar mascota"));
  await screen.findByText("Nueva mascota");
}

function fillValid() {
  fireEvent.change(screen.getByPlaceholderText("Nombre"), { target: { value: "Andy" } });
  fireEvent.change(document.querySelectorAll("select")[0], { target: { value: "Perro" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedPets.mockResolvedValue([]);
});

describe("BUG-05 Cerco — validación del formulario de alta", () => {
  it("caso feliz: datos válidos se guardan saneados y con peso unificado", async () => {
    mockedCreate.mockResolvedValue(ANDY);
    await openNewForm();
    fillValid();
    fireEvent.change(screen.getByPlaceholderText("Raza"), { target: { value: "  Labrador  " } });
    fireEvent.change(screen.getByPlaceholderText("Ej: 10"), { target: { value: "12.5" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    const payload = mockedCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({ name: "Andy", species: "Perro", breed: "Labrador", weight: 12.5 });
    expect("weightKg" in payload).toBe(false);
  });

  it("inválido: raza '?', microchip largo y peso 1200 bloquean con error inline", async () => {
    await openNewForm();
    fillValid();
    fireEvent.change(screen.getByPlaceholderText("Raza"), { target: { value: "?" } });
    fireEvent.change(screen.getByPlaceholderText("15 dígitos"), { target: { value: "123456789masdigitos" } });
    fireEvent.change(screen.getByPlaceholderText("Ej: 10"), { target: { value: "1200" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => {
      expect(screen.getByText("Entre 2 y 80 caracteres")).toBeInTheDocument();
      expect(screen.getByText("Debe tener exactamente 15 dígitos")).toBeInTheDocument();
      expect(screen.getByText("Peso entre 0 y 500 kg")).toBeInTheDocument();
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("borde: opcionales vacíos pasan y no viajan (sin 400 del backend)", async () => {
    mockedCreate.mockResolvedValue(ANDY);
    await openNewForm();
    fillValid();
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    const payload = mockedCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.breed).toBeUndefined();
    expect(payload.microchip).toBeUndefined();
    expect(payload.weight).toBeUndefined();
  });
});

describe("BUG-05 Frontera — payload web ↔ schemas backend", () => {
  it("lo que el form deja pasar, los schemas lo aceptan (contrato alineado)", async () => {
    mockedCreate.mockResolvedValue(ANDY);
    await openNewForm();
    fillValid();
    fireEvent.change(screen.getByPlaceholderText("Raza"), { target: { value: "Labrador" } });
    fireEvent.change(screen.getByPlaceholderText("15 dígitos"), { target: { value: "123456789012345" } });
    fireEvent.change(screen.getByPlaceholderText("Ej: 10"), { target: { value: "25" } });
    fireEvent.click(screen.getByText("Guardar"));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    const payload = mockedCreate.mock.calls[0][0] as Record<string, unknown>;
    // Reglas espejo del backend: si esto pasa acá, pasa allá
    expect((payload.name as string).length).toBeLessThanOrEqual(50);
    expect((payload.breed as string).length).toBeGreaterThanOrEqual(2);
    expect(payload.microchip).toMatch(/^\d{15}$/);
    expect(payload.weight as number).toBeLessThanOrEqual(500);
  });
});
