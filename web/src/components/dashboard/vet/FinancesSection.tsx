const summaryCards = [
  { label: "Ingresos del mes", value: "$45,200", change: "+12%", positive: true, icon: "💰" },
  { label: "Consultas realizadas", value: "52", change: "+8%", positive: true, icon: "📊" },
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Finanzas</h1>
          <p className="text-[#475569]">Control de ingresos y transacciones</p>
        </div>
        <button className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
          Exportar reporte
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-bold ${card.positive ? "text-[#16A34A]" : "text-red-500"}`}>
                {card.change}
              </span>
            </div>
            <p className="text-xl font-bold text-[#0F172A]">{card.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#475569]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
        <div className="border-b border-[#CBD5E1] px-5 py-4">
          <h3 className="text-lg font-bold text-[#0F172A]">Transacciones recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Paciente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Dueño</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#475569]">Servicio</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#475569]">Monto</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#475569]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-4 text-sm text-[#0F172A]">{t.date}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#0F172A]">{t.patient}</td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{t.owner}</td>
                  <td className="px-5 py-4 text-sm text-[#475569]">{t.service}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-[#0F172A]">${t.amount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      t.status === "Pagado"
                        ? "bg-[#DCFCE7] text-[#16A34A]"
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
