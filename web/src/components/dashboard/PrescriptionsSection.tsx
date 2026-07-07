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
          <h1 className="text-2xl font-bold text-[#0F172A]">Recetas</h1>
          <p className="text-[#475569]">Medicamentos e indicaciones para tus mascotas</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-[#0F172A]">{rx.pet}</p>
                <p className="text-sm text-[#475569]">{rx.vet}</p>
                <p className="text-xs text-[#94A3B8]">{rx.date}</p>
              </div>
              <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#16A34A]">
                Activa
              </span>
            </div>

            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">Medicamentos</p>
              <div className="flex flex-wrap gap-2">
                {rx.medications.map((med) => (
                  <span
                    key={med}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2563EB]"
                  >
                    💊 {med}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4 border-t border-[#F1F5F9] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">Indicaciones</p>
              <ul className="space-y-1">
                {rx.instructions.map((inst) => (
                  <li key={inst} className="flex items-start gap-2 text-sm text-[#475569]">
                    <span className="mt-0.5 text-[#16A34A]">✓</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full rounded-lg bg-[#2563EB] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Descargar PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
