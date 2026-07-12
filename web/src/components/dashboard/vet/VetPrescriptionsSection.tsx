import { useState } from "react";
import { Pill } from "lucide-react";

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
          <h1 className="text-2xl font-bold text-ink">Recetas</h1>
          <p className="text-slate-500">Prescribe y gestiona medicamentos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          + Nueva receta
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-teal-700/30 bg-teal-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-ink">Nueva receta</h3>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Paciente</label>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Medicamento</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Nombre del medicamento"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Dosis</label>
              <input
                type="text"
                value={medDosis}
                onChange={(e) => setMedDosis(e.target.value)}
                placeholder="Ej: Cada 12 horas"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Duración</label>
              <input
                type="text"
                value={medDuracion}
                onChange={(e) => setMedDuracion(e.target.value)}
                placeholder="Ej: 7 días"
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Crear receta
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-ink">{rx.pet}</p>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    rx.status === "Activa" ? "bg-success-bg text-success" : "bg-gray-100 text-slate-400"
                  }`}>
                    {rx.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{rx.owner}</p>
                <p className="text-xs text-slate-400">{rx.date}</p>
              </div>
            </div>
            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Medicamentos</p>
              <div className="space-y-2">
                {rx.medications.map((med) => (
                  <div key={med.name} className="flex items-start gap-2 rounded-lg bg-surface p-3">
                    <Pill className="mt-0.5 h-4 w-4 text-teal-700" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosis} · {med.duracion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                Editar
              </button>
              <button className="flex-1 rounded-lg bg-teal-700 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Descargar PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
