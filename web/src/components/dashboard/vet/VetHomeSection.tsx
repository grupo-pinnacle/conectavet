import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getManagedPets } from "../../../services/endpoints";
import { getMyConsultations } from "../../../services/endpoints";
import { MessageCircle, Clock, Users, Wifi, WifiOff } from "lucide-react";

export default function VetHomeSection() {
  const { user, isOnline, setOnline, onlineLoading, onlineError } = useAuth();
  const [totalPatients, setTotalPatients] = useState(0);
  const [activeCons, setActiveCons] = useState(0);
  const [waitingCons, setWaitingCons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pets, cons] = await Promise.all([
          getManagedPets(),
          getMyConsultations(),
        ]);
        setTotalPatients(pets.length);
        setActiveCons(cons.filter((c) => c.status === "ACTIVE").length);
        setWaitingCons(cons.filter((c) => c.status === "WAITING").length);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Pacientes", value: String(totalPatients), color: "text-teal-700", icon: Users },
    { label: "Consultas activas", value: String(activeCons), color: "text-success", icon: MessageCircle },
    { label: "En espera", value: String(waitingCons), color: "text-amber-500", icon: Clock },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">
          Buen día, Dr. {user?.name?.split(" ")[0] || "López"}
        </h1>
        <p className="text-slate-500">Resumen de tu clínica</p>
      </div>

      <div
        className={`mb-8 flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-colors sm:flex-row sm:items-center ${
          isOnline ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isOnline ? "bg-green-600 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {isOnline ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              <p className="text-sm font-bold text-ink">
                {isOnline ? "Disponible para consultas" : "No estás disponible"}
              </p>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {isOnline
                ? "Los clientes pueden encontrarte y asignarte consultas nuevas."
                : "No aparecerás en la búsqueda de veterinarios hasta que te pongas online."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOnline(!isOnline)}
          disabled={onlineLoading}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60 sm:ml-auto ${
            isOnline ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {onlineLoading
            ? "Actualizando..."
            : isOnline
              ? "Ponerse offline"
              : "Ponerse online"}
        </button>
      </div>

      {onlineError && (
        <p className="mb-4 text-sm font-semibold text-danger">
          {onlineError}
        </p>
      )}

      {loading ? (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-2">
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-teal-700/30 bg-teal-50 p-5">
        <p className="mb-2 flex items-center gap-1 text-sm font-bold text-teal-700">
          <MessageCircle className="h-4 w-4" /> Acciones rápidas
        </p>
        <p className="text-sm text-slate-600">
          Andá a la sección <strong>Mensajes</strong> para ver las consultas
          disponibles y activas. Desde ahí podés tomar consultas, chatear con
          los dueños y cerrar las consultas con notas.
        </p>
      </div>
    </div>
  );
}
