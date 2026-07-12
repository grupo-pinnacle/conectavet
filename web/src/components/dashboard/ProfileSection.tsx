import { useAuth } from "../../hooks/useAuth";

export default function ProfileSection() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>
        <p className="text-slate-500">Información personal y configuración</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar card */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm md:col-span-1">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-teal-700 text-3xl font-bold text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
            <p className="text-xl font-bold text-ink">{user?.name || "Usuario"}</p>
            <p className="text-sm text-slate-500">{user?.role === "vet" ? "Veterinario" : "Dueño de mascota"}</p>
            <button className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Cambiar foto
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm md:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-ink">Información personal</h3>
          <div className="space-y-4">
            {[
              { label: "Nombre completo", value: user?.name || "Juan Pérez" },
              { label: "Correo electrónico", value: user?.email || "juan@email.com" },
              { label: "Teléfono", value: "+52 55 1234 5678" },
              { label: "Dirección", value: "Av. Principal 123, CDMX" },
            ].map((field) => (
              <div key={field.label} className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <p className="text-xs text-slate-400">{field.label}</p>
                  <p className="font-semibold text-ink">{field.value}</p>
                </div>
                <button className="text-sm font-semibold text-teal-700 hover:underline">Editar</button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-bold text-ink">Configuración</h3>
            <div className="space-y-3">
              {[
                { label: "Notificaciones push", enabled: true },
                { label: "Recordatorio de citas", enabled: true },
                { label: "Email promocional", enabled: false },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{setting.label}</p>
                  <div
                    className={`h-6 w-11 cursor-pointer rounded-full transition-colors ${
                      setting.enabled ? "bg-teal-700" : "bg-border"
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
    </div>
  );
}
