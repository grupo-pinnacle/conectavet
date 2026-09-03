import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../services/api";
import { deletePet, updatePet } from "../services/endpoints";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BUG-02 Frontera — contrato endpoints ↔ REST ↔ backend", () => {
  it("deletePet emite DELETE /api/pets/:id (ruta probada en backend pets.test.ts → 200)", async () => {
    mockedApi.delete.mockResolvedValue({ data: { success: true, message: "Mascota eliminada" } });

    await deletePet("pet-1");

    expect(mockedApi.delete).toHaveBeenCalledTimes(1);
    expect(mockedApi.delete).toHaveBeenCalledWith("/api/pets/pet-1");
  });

  it("updatePet emite PUT /api/pets/:id con el payload sanitizado", async () => {
    mockedApi.put.mockResolvedValue({ data: { success: true, data: { id: "pet-1" } } });

    await updatePet("pet-1", { name: "Andy II", species: undefined, age: undefined });

    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith("/api/pets/pet-1", {
      name: "Andy II",
      species: undefined,
      age: undefined,
    });
  });

  it("borde: el error del backend se propaga con response.data.message intacto", async () => {
    mockedApi.put.mockRejectedValue({ response: { status: 400, data: { message: "La especie es requerida" } } });

    const err = await updatePet("pet-1", { species: "" } as never).catch((e) => e);

    expect(err?.response?.data?.message).toBe("La especie es requerida");
  });
});
