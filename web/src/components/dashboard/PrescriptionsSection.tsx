import { Pill } from "lucide-react";

const prescriptions = [
  {
    id: 1,
    pet: "Firulais",
    vet: "Dr. Martín López",
    date: "15 Jun 2025",
    medications: ["Amoxicilina 500mg", "Probiótico"],
    instructions: ["Mantener hidratado", "Alimentación liviana", "Reposo"],
  },
  {
    id: 2,
    pet: "Mishi",
    vet: "Dra. Sofía Ramirez",
    date: "12 May 2025",
    medications: ["Cortisona tópica", "Antihistamínico"],
    instructions: ["Aplicar 2 veces al día", "Evitar lamido"],
  },
];

export default function PrescriptionsSection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Recetas</h1>
          <p className="text-slate-500">Medicamentos e indicaciones para tus mascotas</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="rounded-xl border border-border bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-ink">{rx.pet}</p>
                <p className="text-sm text-slate-500">{rx.vet}</p>
                <p className="text-xs text-slate-400">{rx.date}</p>
              </div>
              <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success">
                Activa
              </span>
            </div>

            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Medicamentos</p>
              <div className="flex flex-wrap gap-2">
                {rx.medications.map((med) => (
                  <span
                    key={med}
                    className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700"
                  >
                    <Pill className="mr-1 inline h-4 w-4" /> {med}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Indicaciones</p>
              <ul className="space-y-1">
                {rx.instructions.map((inst) => (
                  <li key={inst} className="flex items-start gap-2 text-sm text-slate-500">
                    <span className="mt-0.5 text-success">✓</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Descargar PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
