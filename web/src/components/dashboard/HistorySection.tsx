import { PawPrint } from "lucide-react";

interface HistoryRecord {
  date: string;
  specialty: string;
  vet: string;
  diagnosis: string;
  pet: string;
}

const records: HistoryRecord[] = [
  { date: "12 May 2026", specialty: "Dermatología", vet: "Dra. Sofía Ramirez", diagnosis: "Alergia cutánea", pet: "Firulais" },
  { date: "02 Abr 2026", specialty: "Consulta general", vet: "Dra. Ana Torres", diagnosis: "Revisión general", pet: "Mishi" },
  { date: "15 Feb 2026", specialty: "Control anual", vet: "Dr. Pablo García", diagnosis: "Vacunas al día", pet: "Firulais" },
  { date: "10 Nov 2025", specialty: "Vacunación", vet: "Dr. Martín López", diagnosis: "Antirrábica aplicada", pet: "Luna" },
];

const petIcons: Record<string, string> = {
  Firulais: "🐶",
  Mishi: "🐱",
  Luna: "🐩",
};

export default function HistorySection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Historial clínico</h1>
          <p className="text-slate-500">Registro completo de las consultas de tus mascotas</p>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Filtrar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mascota</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">Especialidad</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Veterinario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
            <tr key={`${r.date}-${r.specialty}`} className="border-b border-[#F1F5F9] last:border-0 hover:bg-slate-100">
                <td className="px-4 py-4 text-sm font-semibold text-ink whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-4 text-sm text-ink whitespace-nowrap">
                  <span className="mr-1">{petIcons[r.pet] || <PawPrint className="inline h-4 w-4" />}</span>
                  {r.pet}
                </td>
                <td className="hidden px-4 py-4 text-sm text-slate-500 sm:table-cell">{r.specialty}</td>
                <td className="hidden px-4 py-4 text-sm text-slate-500 md:table-cell">{r.vet}</td>
                <td className="px-4 py-4 text-sm font-medium text-ink">{r.diagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
