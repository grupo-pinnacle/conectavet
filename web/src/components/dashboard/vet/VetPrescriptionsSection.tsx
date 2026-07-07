import { useState } from "react";

const prescriptions = [
  { id: 1, pet: "Firulais", owner: "Juan Pérez", vet: "Dr. Martín López", date: "15 Jul 2025", medications: [{ name: "Amoxicilina 500mg", dosis: "Cada 12 horas", duracion: "7 días" }, { name: "Probiótico", dosis: "1 vez al día", duracion: "10 días" }], status: "Activa" },
  { id: 2, pet: "Mishi", owner: "María García", vet: "Dr. Martín López", date: "12 May 2025", medications: [{ name: "Cortisona tópica", dosis: "2 veces al día", duracion: "14 días" }, { name: "Antihistamínico", dosis: "1 vez al día", duracion: "7 días" }], status: "Vencida" },
  { id: 3, pet: "Rocky", owner: "Pedro Díaz", vet: "Dr. Martín López", date: "20 Jun 2025", medications: [{ name: "Tramadol 50mg", dosis: "Cada 8 horas", duracion: "5 días" }, { name: "Antiinflamatorio", dosis: "Cada 12 horas", duracion: "7 días" }], status: "Activa" },
];

const patients = ["Firulais", "Mishi", "Luna", "Rocky", "Bella", "Coco", "Max", "Nala"];

export default function VetPrescriptionsSection() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState(patients[0]);
  const [medName, setMedName] = useState("");
  const [medDosis, setMedDosis] = useState("");
  const [medDuracion, setMedDuracion] = useState("");

  const handleCreate = () => {
    setShowForm(false);
    setMedName("");
    setMedDosis("");
    setMedDuracion("");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Recetas</h1>
          <p className="text-[#475569]">Prescribe y gestiona medicamentos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          + Nueva receta
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-[#2563EB]/30 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A]">Nueva receta</h3>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Paciente</label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Medicamento</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Nombre del medicamento"
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Dosis</label>
              <input
                type="text"
                value={medDosis}
                onChange={(e) => setMedDosis(e.target.value)}
                placeholder="Ej: Cada 12 horas"
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Duración</label>
              <input
                type="text"
                value={medDuracion}
                onChange={(e) => setMedDuracion(e.target.value)}
                placeholder="Ej: 7 días"
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Crear receta
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#CBD5E1] px-6 py-2.5 text-sm font-semibold text-[#475569] hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-[#0F172A]">{rx.pet}</p>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    rx.status === "Activa" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-gray-100 text-[#94A3B8]"
                  }`}>
                    {rx.status}
                  </span>
                </div>
                <p className="text-sm text-[#475569]">{rx.owner}</p>
                <p className="text-xs text-[#94A3B8]">{rx.date}</p>
              </div>
            </div>
            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">Medicamentos</p>
              <div className="space-y-2">
                {rx.medications.map((med) => (
                  <div key={med.name} className="flex items-start gap-2 rounded-lg bg-[#F8FAFC] p-3">
                    <span className="mt-0.5 text-[#2563EB]">💊</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#0F172A]">{med.name}</p>
                      <p className="text-xs text-[#475569]">{med.dosis} · {med.duracion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-[#CBD5E1] py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
                Editar
              </button>
              <button className="flex-1 rounded-lg bg-[#2563EB] py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Descargar PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
