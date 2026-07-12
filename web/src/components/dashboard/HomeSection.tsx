import { useAuth } from "../../hooks/useAuth";
import { Search, PawPrint, Calendar, ClipboardList, Pill, Bell } from "lucide-react";

const pets = [
  { name: "Firulais", breed: "Golden Retriever", age: "3 años", weight: "28 kg", nextVet: "15 Jul 2025" },
  { name: "Mishi", breed: "Gato", age: "2 años", weight: "5 kg", nextVet: "22 Jul 2025" },
  { name: "Luna", breed: "Caniche", age: "4 años", weight: "7 kg", nextVet: "10 Ago 2025" },
];

const upcoming = [
  { vet: "Dr. Martín Lopez", specialty: "Cardiología", date: "Hoy", time: "15:30 hs", status: "Confirmada" },
  { vet: "Dra. Sofía Ramirez", specialty: "Dermatología", date: "Mañana", time: "10:00 hs", status: "Pendiente" },
];

interface HomeSectionProps {
  onNavigate: (tab: string) => void;
}

export default function HomeSection({ onNavigate }: HomeSectionProps) {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">
          Hola, {user?.name?.split(" ")[0] || "Juan"}!
        </h1>
        <p className="text-slate-500">¿Cómo está hoy tu mascota?</p>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar veterinario, mascota o consulta..."
            className="w-full rounded-lg border border-border bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Mascotas", value: "3", color: "text-teal-700" },
          { label: "Consultas", value: "12", color: "text-success" },
          { label: "Próximas", value: "2", color: "text-teal-700" },
          { label: "Recetas", value: "4", color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Nueva consulta", icon: Calendar, action: "consultations" },
            { label: "Historial clínico", icon: ClipboardList, action: "history" },
            { label: "Recetas", icon: Pill, action: "prescriptions" },
            { label: "Notificaciones", icon: Bell, action: "notifications" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.action)}
              className="flex flex-col items-center rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:bg-slate-100"
            >
              <item.icon className="mb-2 h-8 w-8 text-teal-700" />
              <span className="text-sm font-semibold text-ink">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Mis mascotas</h2>
            <button onClick={() => onNavigate("pets")} className="text-sm font-semibold text-teal-700 hover:underline">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {pets.map((pet) => (
              <div
                key={pet.name}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-colors hover:bg-slate-100"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100"><PawPrint className="h-7 w-7 text-amber-600" /></div>
                <div className="flex-1">
                  <p className="font-bold text-ink">{pet.name}</p>
                  <p className="text-sm text-slate-500">{pet.breed} · {pet.age} · {pet.weight}</p>
                  <p className="text-xs text-teal-700">Próximo control: {pet.nextVet}</p>
                </div>
                <button className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                  Agendar
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Próximas consultas</h2>
            <button onClick={() => onNavigate("consultations")} className="text-sm font-semibold text-teal-700 hover:underline">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {upcoming.map((c) => (
              <div
                key={`${c.vet}-${c.time}`}
                className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                      {c.vet.split(" ")[1]?.charAt(0) || "D"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{c.vet}</p>
                      <p className="text-xs text-slate-500">{c.specialty}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      c.status === "Confirmada"
                        ? "bg-success-bg text-success"
                        : "bg-yellow-50 text-yellow-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1 whitespace-nowrap"><Calendar size={14} /> {c.date}</span>
                  <span className="whitespace-nowrap">⏰ {c.time}</span>
                </div>
                <button className="mt-3 w-full rounded-lg bg-teal-700 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                  Ingresar a la consulta
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
