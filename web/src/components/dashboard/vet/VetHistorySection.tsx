import { useState } from "react";

const records = [
  { date: "15 Jul 2025", pet: "Firulais", owner: "Juan Pérez", type: "Consulta general", diagnosis: "Alergia estacional", treatment: "Antihistamínicos por 7 días", notes: "Paciente estable", avatar: "🐶" },
  { date: "12 May 2025", pet: "Mishi", owner: "María García", type: "Dermatología", diagnosis: "Alergia cutánea", treatment: "Cortisona tópica + baños medicados", notes: "Seguimiento en 2 semanas", avatar: "🐱" },
  { date: "10 Nov 2025", pet: "Luna", owner: "Carlos López", type: "Vacunación", diagnosis: "Vacuna antirrábica aplicada", treatment: "Ninguno", notes: "Próxima dosis en 1 año", avatar: "🐩" },
  { date: "20 Jun 2025", pet: "Rocky", owner: "Pedro Díaz", type: "Cirugía menor", diagnosis: "Luxación de rótula", treatment: "Cirugía correctiva + reposo", notes: "Requiere control post-operatorio", avatar: "🐶" },
  { date: "05 Mar 2025", pet: "Bella", owner: "Laura Sánchez", type: "Control anual", diagnosis: "Saludable", treatment: "Vacunas al día", notes: "Recomendar chequeo dental", avatar: "🐕" },
  { date: "01 Jul 2025", pet: "Coco", owner: "Luis Martínez", type: "Consulta general", diagnosis: "Deficiencia vitamínica", treatment: "Suplemento vitamínico A+D", notes: "Mejorar alimentación", avatar: "🐦" },
];

const patientNames = [...new Set(records.map((r) => r.pet))];

export default function VetHistorySection() {
  const [filterPet, setFilterPet] = useState("Todos");

  const filtered = filterPet === "Todos"
    ? records
    : records.filter((r) => r.pet === filterPet);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Historial clínico</h1>
          <p className="text-[#475569]">Registro de consultas de todos los pacientes</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterPet}
            onChange={(e) => setFilterPet(e.target.value)}
            className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="Todos">Todos los pacientes</option>
            {patientNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
            Exportar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">
                  {r.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0F172A]">{r.pet}</p>
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#475569]">
                      {r.type}
                    </span>
                  </div>
                  <p className="text-sm text-[#475569]">{r.owner} · {r.date}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#475569]">Diagnóstico</p>
                <p className="text-sm font-semibold text-[#0F172A]">{r.diagnosis}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#475569]">Tratamiento</p>
                <p className="text-sm text-[#0F172A]">{r.treatment}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#475569]">Notas</p>
                <p className="text-sm text-[#475569]">{r.notes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
