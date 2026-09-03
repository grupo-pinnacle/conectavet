import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DirectorySection from "../components/dashboard/DirectorySection";
import { listVets, getMyPets } from "../services/endpoints";
import type { Pet } from "../types";

vi.mock("../services/endpoints", () => ({
  listVets: vi.fn(),
  getVetById: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  createConsultation: vi.fn(),
  getMyPets: vi.fn(),
}));

const mockedListVets = vi.mocked(listVets);
const mockedGetMyPets = vi.mocked(getMyPets);

const VET = {
  id: "vet-1",
  email: "ana@test.com",
  firstName: "Ana",
  lastName: "Vet",
  isOnline: true,
  ratingAvg: 4.5,
  ratingCount: 10,
  isFavorite: false,
};

const ANDY = { id: "pet-1", name: "Andy", species: "Perro", ownerId: "client-1" } as Pet;
const FALSE_MSG = /primero registrá una mascota/i;

async function openConsultModal() {
  render(<DirectorySection />);
  const btn = await screen.findByText("Consultar");
  fireEvent.click(btn);
  await screen.findByText("Consultar a Ana Vet");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedListVets.mockResolvedValue([VET]);
});

describe("BUG-04 Cerco — modal Consultar no miente mientras carga", () => {
  it("borde BUG-04: con fetch en vuelo muestra spinner y jamás el falso 'registrá'", async () => {
    let resolvePets!: (p: Pet[]) => void;
    mockedGetMyPets.mockImplementation(() => new Promise<Pet[]>((r) => { resolvePets = r; }));
    await openConsultModal();

    // Carga en vuelo: spinner sí, mensaje falso no
    expect(screen.getByText(/cargando tus mascotas/i)).toBeInTheDocument();
    expect(screen.queryByText(FALSE_MSG)).not.toBeInTheDocument();

    // Resuelve con mascotas: formulario directo, sin parpadeo al mensaje falso
    resolvePets([ANDY]);
    await waitFor(() => {
      expect(screen.getByText("Andy (Perro)")).toBeInTheDocument();
    });
    expect(screen.queryByText(FALSE_MSG)).not.toBeInTheDocument();
  });

  it("caso feliz: mascotas cargadas muestran el formulario y el botón Enviar", async () => {
    mockedGetMyPets.mockResolvedValue([ANDY]);
    await openConsultModal();

    await waitFor(() => {
      expect(screen.getByText("Andy (Perro)")).toBeInTheDocument();
      expect(screen.getByText("Enviar consulta")).toBeInTheDocument();
    });
    expect(screen.queryByText(FALSE_MSG)).not.toBeInTheDocument();
  });

  it("vacío real: sin mascotas confirmadas muestra el mensaje de registro (correcto)", async () => {
    mockedGetMyPets.mockResolvedValue([]);
    await openConsultModal();

    await waitFor(() => {
      expect(screen.getByText(FALSE_MSG)).toBeInTheDocument();
    });
    expect(screen.queryByText("Enviar consulta")).not.toBeInTheDocument();
  });

  it("error de red: muestra error + Reintentar, nunca el falso 'registrá'", async () => {
    mockedGetMyPets.mockRejectedValueOnce(new Error("Network Error"));
    await openConsultModal();

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar tus mascotas/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(FALSE_MSG)).not.toBeInTheDocument();

    // Reintentar refetchea y abre el formulario
    mockedGetMyPets.mockResolvedValue([ANDY]);
    fireEvent.click(screen.getByText("Reintentar"));
    await waitFor(() => {
      expect(screen.getByText("Andy (Perro)")).toBeInTheDocument();
    });
    expect(mockedGetMyPets).toHaveBeenCalledTimes(2);
  });
});

describe("BUG-04 Frontera — contrato modal ↔ getMyPets", () => {
  it("cada apertura refetchea la lista (adiós datos stale)", async () => {
    mockedGetMyPets.mockResolvedValue([ANDY]);
    render(<DirectorySection />);
    const btn = await screen.findByText("Consultar");
    fireEvent.click(btn);
    await screen.findByText("Consultar a Ana Vet");
    fireEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Consultar a Ana Vet")).not.toBeInTheDocument();
    });
    fireEvent.click(await screen.findByText("Consultar"));
    await screen.findByText("Consultar a Ana Vet");
    expect(mockedGetMyPets).toHaveBeenCalledTimes(2);
  });
});
