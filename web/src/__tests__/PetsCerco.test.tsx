import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PetsSection from "../components/dashboard/PetsSection";
import { getMyPets, updatePet, deletePet } from "../services/endpoints";
import type { Pet } from "../types";

vi.mock("../services/endpoints", () => ({
  getMyPets: vi.fn(),
  createPet: vi.fn(),
  updatePet: vi.fn(),
  getPetById: vi.fn(),
  deletePet: vi.fn(),
}));

const mockedPets = vi.mocked(getMyPets);
const mockedUpdate = vi.mocked(updatePet);
const mockedDelete = vi.mocked(deletePet);

const ANDY: Pet = {
  id: "pet-1",
  name: "Andy",
  species: "Perro",
  breed: "Labrador",
  age: 3,
  ownerId: "client-1",
} as Pet;

function apiError(message: string) {
  return { response: { data: { message } } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  mockedPets.mockResolvedValue([ANDY]);
});

async function openEditForm() {
  render(<PetsSection />);
  await screen.findByText("Andy");
  fireEvent.click(screen.getByText("Editar"));
  await screen.findByText("Editar a Andy");
}

describe("BUG-02 Cerco — editar mascota", () => {
  it("caso feliz: cambia el nombre y la tarjeta se actualiza", async () => {
    mockedUpdate.mockResolvedValue({ ...ANDY, name: "Andy II" });
    await openEditForm();

    fireEvent.change(screen.getByPlaceholderText("Nombre"), { target: { value: "Andy II" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith("pet-1", expect.objectContaining({ name: "Andy II" }));
      expect(screen.getByText("Andy II")).toBeInTheDocument();
    });
  });

  it("borde: especie vacía se omite del payload (no viaja '' que el 400 rechaza)", async () => {
    mockedUpdate.mockResolvedValue({ ...ANDY });
    await openEditForm();

    const selects = document.querySelectorAll("select");
    fireEvent.change(selects[0], { target: { value: "" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    const payload = mockedUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.species).toBeUndefined();
    expect("species" in payload && payload.species !== undefined).toBe(false);
  });

  it("borde: edad vaciada (0) se omite del payload en vez de romper Zod positive()", async () => {
    mockedUpdate.mockResolvedValue({ ...ANDY });
    await openEditForm();

    const numbers = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[0], { target: { value: "" } });
    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    const payload = mockedUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.age).toBeUndefined();
  });

  it("inválido: un 400 del backend muestra el mensaje real, no el genérico", async () => {
    mockedUpdate.mockRejectedValue(apiError("La especie es requerida"));
    await openEditForm();

    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => {
      expect(screen.getByText("La especie es requerida")).toBeInTheDocument();
    });
  });
});

describe("BUG-02 Cerco — eliminar mascota", () => {
  async function renderList() {
    render(<PetsSection />);
    await screen.findByText("Andy");
  }

  it("caso feliz: confirma, llama DELETE y la tarjeta desaparece", async () => {
    mockedDelete.mockResolvedValue(undefined);
    await renderList();

    fireEvent.click(screen.getByText("Eliminar"));

    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith("pet-1");
      expect(screen.queryByText("Andy")).not.toBeInTheDocument();
    });
  });

  it("borde: si cancela la confirmación no se llama al backend", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    await renderList();

    fireEvent.click(screen.getByText("Eliminar"));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockedDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Andy")).toBeInTheDocument();
  });

  it("inválido: error del backend muestra el mensaje real y conserva la tarjeta", async () => {
    mockedDelete.mockRejectedValue(apiError("No tenés permiso para eliminar esta mascota"));
    await renderList();

    fireEvent.click(screen.getByText("Eliminar"));

    await waitFor(() => {
      expect(screen.getByText("No tenés permiso para eliminar esta mascota")).toBeInTheDocument();
      expect(screen.getByText("Andy")).toBeInTheDocument();
    });
  });
});
