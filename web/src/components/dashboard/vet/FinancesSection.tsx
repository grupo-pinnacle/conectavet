import { DollarSign, LayoutDashboard } from "lucide-react";

const summaryCards = [
  { label: "Ingresos del mes", value: "$45,200", change: "+12%", positive: true, icon: DollarSign },
  { label: "Consultas realizadas", value: "52", change: "+8%", positive: true, icon: LayoutDashboard },
  { label: "Pendientes de cobro", value: "$8,400", change: "-3%", positive: false, icon: "⏳" },
  { label: "Gastos operativos", value: "$12,300", change: "+5%", positive: false, icon: "📉" },
];

const transactions = [
  { date: "15 Jul 2025", patient: "Firulais", owner: "Juan Pérez", service: "Consulta general", amount: 1500, status: "Pagado" },
  { date: "12 May 2025", patient: "Mishi", owner: "María García", service: "Dermatología", amount: 1800, status: "Pagado" },
  { date: "10 Nov 2025", patient: "Luna", owner: "Carlos López", service: "Vacunación", amount: 800, status: "Pagado" },
  { date: "20 Jun 2025", patient: "Rocky", owner: "Pedro Díaz", service: "Cirugía menor", amount: 5500, status: "Pendiente" },
  { date: "05 Mar 2025", patient: "Bella", owner: "Laura Sánchez", service: "Control anual", amount: 1200, status: "Pagado" },
  { date: "01 Jul 2025", patient: "Coco", owner: "Luis Martínez", service: "Consulta general", amount: 1000, status: "Pendiente" },
];

export default function FinancesSection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Finanzas</h1>
          <p className="text-slate-500">Control de ingresos y transacciones</p>
        </div>
        <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          Exportar reporte
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              {typeof card.icon === "string" ? <span className="text-2xl">{card.icon}</span> : <card.icon className="h-6 w-6 text-teal-700" />}
              <span className={`text-xs font-bold ${card.positive ? "text-success" : "text-red-500"}`}>
                {card.change}
              </span>
            </div>
            <p className="text-xl font-bold text-ink">{card.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-lg font-bold text-ink">Transacciones recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-surface">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Paciente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Dueño</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Servicio</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Monto</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] last:border-0 hover:bg-slate-100">
                  <td className="px-5 py-4 text-sm text-ink">{t.date}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-ink">{t.patient}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{t.owner}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{t.service}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-ink">${t.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      t.status === "Pagado"
                        ? "bg-success-bg text-success"
                        : "bg-yellow-50 text-yellow-600"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
