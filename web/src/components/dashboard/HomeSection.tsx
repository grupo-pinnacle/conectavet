import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyPets } from "../../services/endpoints";
import { getMyConsultations } from "../../services/endpoints";
import { PawPrint, Calendar, MessageCircle, ClipboardList } from "lucide-react";

interface HomeSectionProps {
  onNavigate: (tab: string) => void;
}

export default function HomeSection({ onNavigate }: HomeSectionProps) {
  const { user } = useAuth();
  const [petsCount, setPetsCount] = useState(0);
  const [activeCons, setActiveCons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pets, cons] = await Promise.all([
          getMyPets(),
          getMyConsultations(),
        ]);
        setPetsCount(pets.length);
        setActiveCons(cons.filter((c) => c.status !== "COMPLETED").length);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">
          Hola, {user?.name?.split(" ")[0] || "Juan"}!
        </h1>
        <p className="text-slate-500">¿Cómo está hoy tu mascota?</p>
      </div>

      {loading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Mascotas", value: String(petsCount), color: "text-teal-700" },
            { label: "Consultas activas", value: String(activeCons), color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Nueva consulta", icon: Calendar, action: "consultations" },
            { label: "Historial clínico", icon: ClipboardList, action: "history" },
            { label: "Mensajes", icon: MessageCircle, action: "messages" },
            { label: "Mascotas", icon: PawPrint, action: "pets" },
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
    </div>
  );
}
