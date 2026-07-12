const monthlyStats = [
  { month: "Ene", pacientes: 24, consultas: 42, ingresos: 28500 },
  { month: "Feb", pacientes: 28, consultas: 48, ingresos: 32100 },
  { month: "Mar", pacientes: 31, consultas: 55, ingresos: 36800 },
  { month: "Abr", pacientes: 26, consultas: 44, ingresos: 29400 },
  { month: "May", pacientes: 35, consultas: 60, ingresos: 40200 },
  { month: "Jun", pacientes: 30, consultas: 52, ingresos: 34500 },
];

const topDiagnostics = [
  { condition: "Alergias cutáneas", count: 28, percentage: 18 },
  { condition: "Vacunación rutina", count: 24, percentage: 15 },
  { condition: "Infecciones óticas", count: 18, percentage: 12 },
  { condition: "Problemas digestivos", count: 15, percentage: 10 },
  { condition: "Control anual", count: 22, percentage: 14 },
];

export default function ReportsSection() {
  const maxConsultas = Math.max(...monthlyStats.map((s) => s.consultas));
  const maxIngresos = Math.max(...monthlyStats.map((s) => s.ingresos));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Reportes</h1>
          <p className="text-slate-500">Estadísticas y análisis de tu clínica</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink focus:outline-none">
            <option>Últimos 6 meses</option>
            <option>Último año</option>
          </select>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Exportar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">Consultas por mes</h3>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {monthlyStats.map((s) => (
              <div key={s.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">{s.consultas}</span>
                <div
                  className="w-full rounded-t bg-teal-700 transition-all hover:opacity-80"
                  style={{ height: `${(s.consultas / maxConsultas) * 120}px` }}
                />
                <span className="text-xs text-slate-400">{s.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-ink">Ingresos por mes</h3>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {monthlyStats.map((s) => (
              <div key={s.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-success">${(s.ingresos / 1000).toFixed(1)}k</span>
                <div
                  className="w-full rounded-t bg-success transition-all hover:opacity-80"
                  style={{ height: `${(s.ingresos / maxIngresos) * 120}px` }}
                />
                <span className="text-xs text-slate-400">{s.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-ink">Diagnósticos más frecuentes</h3>
          <div className="space-y-3">
            {topDiagnostics.map((d) => (
              <div key={d.condition} className="flex items-center gap-2 md:gap-4">
                <p className="w-32 shrink-0 text-sm font-semibold text-ink md:w-48">{d.condition}</p>
                <div className="flex-1">
                  <div className="h-4 w-full rounded-full bg-[#F1F5F9]">
                    <div
                      className="h-4 rounded-full bg-teal-700 transition-all"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex w-16 shrink-0 items-center justify-end gap-1 md:w-24 md:gap-2">
                  <span className="text-xs font-bold text-ink md:text-sm">{d.count}</span>
                  <span className="text-xs text-slate-400">{d.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
