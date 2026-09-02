import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VerifyRxPage from "../pages/VerifyRxPage";

describe("VerifyRxPage — Verificación Oficial de Recetas Digitales", () => {
  it("renderiza el comprobante con el código de receta indicado", () => {
    render(
      <MemoryRouter initialEntries={["/verify-rx?code=RX-9988AABB"]}>
        <VerifyRxPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Receta Digital Verificada")).toBeInTheDocument();
    expect(screen.getByText("RX-9988AABB")).toBeInTheDocument();
    expect(screen.getByText("Auténtica & Vigente (30 días)")).toBeInTheDocument();
    expect(screen.getByText("Médico Veterinario Matriculado")).toBeInTheDocument();
  });
});
