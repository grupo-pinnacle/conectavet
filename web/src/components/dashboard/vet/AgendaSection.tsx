import { useState } from "react";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const appointments: Record<string, { time: string; pet: string; owner: string; type: string; status: string }[]> = {
  Lun: [
    { time: "09:00", pet: "Firulais", owner: "Juan Pérez", type: "Consulta general", status: "Completada" },
    { time: "10:30", pet: "Mishi", owner: "María García", type: "Dermatología", status: "Confirmada" },
    { time: "12:00", pet: "Luna", owner: "Carlos López", type: "Vacunación", status: "Confirmada" },
  ],
  Mar: [
    { time: "09:00", pet: "Rocky", owner: "Pedro Díaz", type: "Cirugía menor", status: "Confirmada" },
    { time: "14:00", pet: "Bella", owner: "Laura Sánchez", type: "Control anual", status: "Pendiente" },
  ],
  Mié: [
    { time: "10:00", pet: "Max", owner: "Ana Torres", type: "Consulta general", status: "Pendiente" },
    { time: "11:30", pet: "Coco", owner: "Luis Martínez", type: "Vacunación", status: "Pendiente" },
    { time: "15:00", pet: "Nala", owner: "Sofía Ruiz", type: "Dermatología", status: "Pendiente" },
  ],
};

const statusColors: Record<string, string> = {
  Completada: "bg-success-bg text-success",
  Confirmada: "bg-teal-50 text-teal-700",
  Pendiente: "bg-yellow-50 text-yellow-600",
};

export default function AgendaSection() {
  const [selectedDay, setSelectedDay] = useState("Lun");
  const [viewMode, setViewMode] = useState<"dia" | "semana">("dia");

  const dayAppointments = appointments[selectedDay] || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agenda</h1>
          <p className="text-slate-500">Gestiona tus consultas y horarios</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("dia")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                viewMode === "dia"
                  ? "bg-teal-700 text-white"
                  : "border border-border text-slate-500"
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setViewMode("semana")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                viewMode === "semana"
                  ? "bg-teal-700 text-white"
                  : "border border-border text-slate-500"
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
        <div className="flex min-w-[490px] border-b border-border">
          {weekDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 px-2 py-4 text-center text-xs font-semibold transition-colors md:px-3 md:text-sm ${
                selectedDay === day
                  ? "border-b-2 border-teal-700 text-teal-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {day}
              <span className="ml-1 text-xs text-slate-400">
                ({appointments[day]?.length || 0})
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">
              {selectedDay} — {dayAppointments.length} consultas
            </p>
            <button className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 md:px-4">
              + Nueva
            </button>
          </div>

          <div className="space-y-3">
            {dayAppointments.map((apt) => (
              <div
                key={`${apt.time}-${apt.pet}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-slate-100 md:gap-4 md:p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 md:h-12 md:w-12 md:text-sm">
                  {apt.time}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-ink">{apt.pet}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusColors[apt.status] || ""}`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-500">{apt.type}</p>
                  <p className="truncate text-xs text-slate-400">{apt.owner}</p>
                </div>
                <div className="hidden gap-2 md:flex">
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                    Detalle
                  </button>
                  <button className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90">
                    Atender
                  </button>
                </div>
              </div>
            ))}
            {dayAppointments.length === 0 && (
              <div className="py-10 text-center text-slate-400">
                No hay consultas programadas para este día
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
