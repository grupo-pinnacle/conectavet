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
          <h1 className="text-2xl font-bold text-[#0F172A]">Historial clínico</h1>
          <p className="text-[#475569]">Registro completo de las consultas de tus mascotas</p>
        </div>
        <button className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
          Filtrar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-[#CBD5E1] bg-[#F8FAFC]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Mascota</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569] sm:table-cell">Especialidad</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569] md:table-cell">Veterinario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={`${r.date}-${r.specialty}`} className="border-b border-[#F1F5F9] last:border-0 hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-semibold text-[#0F172A] whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-4 text-sm text-[#0F172A] whitespace-nowrap">
                  <span className="mr-1">{petIcons[r.pet] || "🐾"}</span>
                  {r.pet}
                </td>
                <td className="hidden px-4 py-4 text-sm text-[#475569] sm:table-cell">{r.specialty}</td>
                <td className="hidden px-4 py-4 text-sm text-[#475569] md:table-cell">{r.vet}</td>
                <td className="px-4 py-4 text-sm font-medium text-[#0F172A]">{r.diagnosis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
