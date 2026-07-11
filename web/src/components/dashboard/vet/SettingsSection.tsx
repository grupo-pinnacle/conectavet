import { useState } from "react";

export default function SettingsSection() {
  const [workingHours, setWorkingHours] = useState({ start: "09:00", end: "18:00" });

  const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Configuración</h1>
        <p className="text-[#475569]">Administra tu perfil y preferencias</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A]">Perfil profesional</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Nombre completo</label>
              <input type="text" defaultValue="Dr. Martín López" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Especialidad</label>
              <input type="text" defaultValue="Cardiología Veterinaria" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Correo electrónico</label>
              <input type="email" defaultValue="martin.lopez@vetconnect.com" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Teléfono</label>
              <input type="text" defaultValue="+52 55 1234 5678" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none" />
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Guardar cambios
          </button>
        </div>

        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A]">Horario laboral</h3>
          <div className="space-y-4">
            {weekDays.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <p className="w-24 text-sm font-semibold text-[#0F172A]">{day}</p>
                <input
                  type="checkbox"
                  defaultChecked={day !== "Sábado"}
                  className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs text-[#475569]">Disponible</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Horario inicio</label>
              <input
                type="time"
                value={workingHours.start}
                onChange={(e) => setWorkingHours((prev) => ({ ...prev, start: e.target.value }))}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Horario fin</label>
              <input
                type="time"
                value={workingHours.end}
                onChange={(e) => setWorkingHours((prev) => ({ ...prev, end: e.target.value }))}
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Guardar horario
          </button>
        </div>

        <div className="rounded-xl border border-[#CBD5E1] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A]">Notificaciones</h3>
          <div className="space-y-4">
            {[
              { label: "Nuevas consultas agendadas", enabled: true },
              { label: "Recordatorio de citas (24h antes)", enabled: true },
              { label: "Mensajes de dueños", enabled: true },
              { label: "Reportes semanales", enabled: false },
              { label: "Ofertas y promociones", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F172A]">{setting.label}</p>
                <div
                  className={`h-6 w-11 cursor-pointer rounded-full transition-colors ${
                    setting.enabled ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                      setting.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
