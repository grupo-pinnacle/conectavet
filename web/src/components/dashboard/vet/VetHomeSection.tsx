import { useAuth } from "../../../hooks/useAuth";

const stats = [
  { label: "Pacientes totales", value: "156", color: "text-[#2563EB]", icon: "🐾" },
  { label: "Citas hoy", value: "8", color: "text-[#16A34A]", icon: "📅" },
  { label: "Ingresos del mes", value: "$45,200", color: "text-[#2563EB]", icon: "💰" },
  { label: "Pendientes", value: "3", color: "text-amber-500", icon: "⏳" },
];

const todayAppointments = [
  { time: "09:00", pet: "Firulais", owner: "Juan Pérez", type: "Consulta general", status: "En curso" },
  { time: "10:30", pet: "Mishi", owner: "María García", type: "Dermatología", status: "Confirmada" },
  { time: "12:00", pet: "Luna", owner: "Carlos López", type: "Vacunación", status: "Confirmada" },
  { time: "14:00", pet: "Max", owner: "Ana Torres", type: "Cirugía menor", status: "Pendiente" },
  { time: "15:30", pet: "Bella", owner: "Laura Sánchez", type: "Control anual", status: "Pendiente" },
];

const recentPatients = [
  { name: "Firulais", species: "Golden Retriever", lastVisit: "Hace 2 días", owner: "Juan Pérez" },
  { name: "Mishi", species: "Gato" , lastVisit: "Hace 5 días", owner: "María García" },
  { name: "Rocky", species: "Bulldog Francés", lastVisit: "Hace 1 semana", owner: "Pedro Díaz" },
];

export default function VetHomeSection() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Buen día, Dr. {user?.name?.split(" ")[0] || "López"}
        </h1>
        <p className="text-[#475569]">Resumen de tu clínica para hoy</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#475569]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Citas de hoy</h2>
            <button className="text-sm font-semibold text-[#2563EB] hover:underline">
              Ver agenda completa
            </button>
          </div>
          <div className="space-y-3">
            {todayAppointments.map((apt) => {
              const statusColors: Record<string, string> = {
                "En curso": "bg-[#2563EB] text-white",
                Confirmada: "bg-[#DCFCE7] text-[#16A34A]",
                Pendiente: "bg-yellow-50 text-yellow-600",
              };
              return (
                <div
                  key={`${apt.time}-${apt.pet}`}
                  className="flex items-center gap-3 rounded-xl border border-[#CBD5E1] bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 md:gap-4 md:p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#2563EB] md:h-14 md:w-14 md:text-lg">
                    {apt.time.split(":")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold text-[#0F172A]">{apt.pet}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          statusColors[apt.status] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="truncate text-sm text-[#475569]">{apt.type}</p>
                    <p className="truncate text-xs text-[#94A3B8]">{apt.owner} · {apt.time}</p>
                  </div>
                  <button className="shrink-0 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 md:px-4">
                    Iniciar
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Pacientes recientes</h2>
            <button className="text-sm font-semibold text-[#2563EB] hover:underline">
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {recentPatients.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-4 rounded-xl border border-[#CBD5E1] bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl">
                  🐾
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#0F172A]">{p.name}</p>
                  <p className="text-sm text-[#475569]">{p.species}</p>
                  <p className="text-xs text-[#94A3B8]">{p.owner} · {p.lastVisit}</p>
                </div>
                <button className="rounded-lg border border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-gray-50">
                  Historial
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#2563EB]/30 bg-blue-50 p-4 md:p-5">
            <p className="mb-2 text-sm font-bold text-[#2563EB]">💡 Acciones rápidas</p>
            <div className="flex flex-wrap gap-2">
              <button className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-[#475569] shadow-sm hover:bg-gray-50 md:flex-none">
                🩺 Nueva consulta
              </button>
              <button className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-[#475569] shadow-sm hover:bg-gray-50 md:flex-none">
                ➕ Nuevo paciente
              </button>
              <button className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-[#475569] shadow-sm hover:bg-gray-50 md:flex-none">
                💊 Nueva receta
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
