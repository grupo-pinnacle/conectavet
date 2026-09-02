import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrescriptionPDFModal } from "../components/dashboard/PrescriptionPDFModal";
import type { Prescription } from "../types";

describe("PrescriptionPDFModal — Emisión y Renderizado de Receta Digital Oficial", () => {
  const mockRx: Prescription = {
    id: "rx-9876543210",
    consultationId: "cons-123",
    vetId: "vet-1",
    content: "Tratamiento con Amoxicilina",
    medication: "Amoxicilina + Ácido Clavulánico",
    dosage: "250mg cada 12hs",
    frequency: "Cada 12 horas",
    durationDays: "7",
    indications: "Administrar junto con el alimento balanceado.",
    createdAt: new Date().toISOString(),
  };

  it("renderiza correctamente los datos médicos y farmacológicos", () => {
    render(
      <PrescriptionPDFModal
        prescription={mockRx}
        petName="Milo"
        petSpecies="Canino"
        ownerName="Carlos Pérez"
        vetName="Dra. Valentina Rossi"
        vetLicense="M.P. 55.431"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Receta Digital Oficial ConectaVet/i)).toBeInTheDocument();
    expect(screen.getByText(/Amoxicilina \+ Ácido Clavulánico/i)).toBeInTheDocument();
    expect(screen.getByText(/250mg cada 12hs/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrar junto con el alimento balanceado./i)).toBeInTheDocument();
    expect(screen.getByText(/Milo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dra. Valentina Rossi/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/M.P. 55.431/i)).toBeInTheDocument();
  });

  it("permite cerrar el modal al presionar el botón de cierre", () => {
    const handleClose = vi.fn();
    render(
      <PrescriptionPDFModal
        prescription={mockRx}
        petName="Milo"
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByLabelText(/Cerrar modal/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
