import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyPets } from "../../services/endpoints";
import { getMyConsultations } from "../../services/endpoints";
import type { Consultation } from "../../types";
import { PawPrint, Calendar, MessageCircle, ClipboardList, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface HomeSectionProps {
  onNavigate: (tab: string) => void;
}

export default function HomeSection({ onNavigate }: HomeSectionProps) {
  const { user } = useAuth();
  const [petsCount, setPetsCount] = useState(0);
  const [activeConsultations, setActiveConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pets, cons] = await Promise.all([
          getMyPets(),
          getMyConsultations(),
        ]);
        setPetsCount(pets.length);
        const live = cons.filter((c) => c.status === "ACTIVE" || c.status === "PENDING" || c.status === "WAITING");
        setActiveConsultations(live);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const latestLive = activeConsultations[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          Hola, {(user?.name?.split(" ")[0] || user?.firstName || user?.email?.split("@")[0] || "Usuario")}!
        </h1>
        <p className="text-slate-500">¿Cómo está hoy tu mascota?</p>
      </div>

      {/* Live active / queue consultation banner */}
      {latestLive && (
        <div className={`mb-6 rounded-2xl border p-5 shadow-sm transition-all ${
          latestLive.status === "ACTIVE"
            ? "border-green-200 bg-green-50/70"
            : latestLive.status === "PENDING"
              ? "border-sky-200 bg-sky-50/70"
              : "border-amber-200 bg-amber-50/70"
        }`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                latestLive.status === "ACTIVE" ? "bg-green-100 text-green-700" : latestLive.status === "PENDING" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
              }`}>
                {latestLive.status === "ACTIVE" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    latestLive.status === "ACTIVE" ? "bg-green-200/80 text-green-800" : latestLive.status === "PENDING" ? "bg-sky-200/80 text-sky-800" : "bg-amber-200/80 text-amber-800"
                  }`}>
                    {latestLive.status === "ACTIVE" ? "🟢 En consulta activa" : latestLive.status === "PENDING" ? "🔵 Por confirmar con veterinario" : "🟡 En cola de espera"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {latestLive.status === "ACTIVE" ? "Chat y videollamada habilitados" : "Tiempo est. ~2-5 min"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">
                  Atención para <span className="font-bold">{latestLive.pet?.name || "tu mascota"}</span>
                  {latestLive.vet && ` con Dr./Dra. ${latestLive.vet.firstName || latestLive.vet.email}`}
                </p>
                {latestLive.notes && (
                  <p className="mt-0.5 text-xs text-slate-600 italic line-clamp-1">"{latestLive.notes}"</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigate("messages")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm active:scale-95 ${
                latestLive.status === "ACTIVE" ? "bg-green-700 hover:bg-green-800" : "bg-teal-700 hover:bg-teal-800"
              }`}
            >
              <span>{latestLive.status === "ACTIVE" ? "Entrar al chat" : "Ver sala de espera"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Mascotas", value: String(petsCount), color: "text-teal-700", icon: PawPrint },
            { label: "Consultas activas", value: String(activeConsultations.length), color: activeConsultations.length > 0 ? "text-success font-extrabold" : "text-slate-700", icon: MessageCircle },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <stat.icon className={`h-5 w-5 ${stat.color} opacity-80`} />
              </div>
              <p className={`text-3xl font-bold tracking-tight tabular-nums ${stat.color}`}>{stat.value}</p>
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

