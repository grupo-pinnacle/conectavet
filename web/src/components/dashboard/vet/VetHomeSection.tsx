import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getManagedPets } from "../../../services/endpoints";
import { getMyConsultations } from "../../../services/endpoints";
import { PawPrint, MessageCircle, Clock, Users } from "lucide-react";

export default function VetHomeSection() {
  const { user } = useAuth();
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
