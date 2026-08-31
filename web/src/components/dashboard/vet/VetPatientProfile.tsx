import { useState, useEffect, useCallback } from "react";
import { X, Phone, AlertTriangle, Pill, Stethoscope, Clock, CheckCircle, FileText } from "lucide-react";
import { getPetVetCard } from "../../../services/endpoints";
import type { VetCard } from "../../../types";
import Button from "../../Button";
import { formatSex } from "../../../utils/sex";

const speciesEmoji: Record<string, string> = {
  Perro: "🐶",
  Gato: "🐱",
  Ave: "🐦",
  Exótico: "🦎",
};

interface Props {
  petId: string;
  petName: string;
  onClose: () => void;
}

export default function VetPatientProfile({ petId, petName, onClose }: Props) {
  const [data, setData] = useState<VetCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPetVetCard(petId);
      setData(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string } | null)?.response?.data?.message
        || (err as { message?: string } | null)?.message
        || "No se pudo cargar el perfil del paciente";
      console.error("[VetPatientProfile] Error fetching vetcard:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 animate-in fade-in duration-200" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{data ? (speciesEmoji[data.pet.species] || "🐾") : "🐾"}</span>
              <div>
                <h2 className="text-lg font-bold text-ink">{data?.pet.name || petName}</h2>
                <p className="text-xs text-slate-500 capitalize">{data?.pet.species?.toLowerCase()}{data?.pet.breed ? ` · ${data.pet.breed}` : ""}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="text-center">
                <p className="text-red-600 font-semibold text-sm">{error}</p>
                <Button variant="ghost" size="sm" fullWidth={false} onClick={load} className="mt-4">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {data && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-teal-50 p-4 text-center">
                    <p className="text-2xl font-bold text-teal-700">{data.stats.totalConsultations}</p>
                    <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Consultas</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4 text-center">
                    <p className={`font-bold text-blue-700 ${data.stats.ageYears > 0 && data.stats.ageMonths > 0 ? "text-sm leading-tight" : "text-2xl"}`}>
                      {data.stats.ageYears > 0 && data.stats.ageMonths > 0
                        ? `${data.stats.ageYears} año${data.stats.ageYears === 1 ? "" : "s"} y ${data.stats.ageMonths} mes${data.stats.ageMonths === 1 ? "" : "es"}`
                        : data.stats.ageYears > 0
                          ? `${data.stats.ageYears} año${data.stats.ageYears === 1 ? "" : "s"}`
                          : `${data.stats.ageMonths} mes${data.stats.ageMonths === 1 ? "" : "es"}`}
                    </p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Edad</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {data.stats.lastConsultationDate ? new Date(data.stats.lastConsultationDate).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : "—"}
                    </p>
                    <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Últ. visita</p>
                  </div>
                </div>

                {/* Owner info */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-ink uppercase tracking-wider">Dueño</h3>
                  <div className="rounded-xl border border-border bg-[#FAFBFC] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                        {(data.owner.firstName || "?").charAt(0)}{(data.owner.lastName || "").charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{data.owner.firstName || ""} {data.owner.lastName || ""}</p>
                        {data.owner.phone && (
                          <a href={`tel:${data.owner.phone}`} className="mt-0.5 flex items-center gap-1 text-sm text-teal-700 hover:underline">
                            <Phone className="h-3 w-3" />
                            {data.owner.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="mb-3 text-sm font-bold text-ink uppercase tracking-wider">Detalles</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Sexo", value: formatSex(data.pet.sex) },
                      { label: "Color", value: data.pet.color || "—" },
                      { label: "Peso", value: data.pet.weightKg ? `${data.pet.weightKg} kg` : "—" },
                      { label: "Microchip", value: data.pet.microchip || "—" },
                      { label: "Edad exacta", value: data.stats.ageYears > 0 ? `${data.stats.ageYears} años y ${data.stats.ageMonths} meses` : `${data.stats.ageMonths} meses` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-[#FAFBFC] px-4 py-3">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{item.label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                {data.allergies.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink uppercase tracking-wider">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Alergias
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.allergies.map((a, i) => (
                        <span key={i} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronic conditions */}
                {data.chronicConditions.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink uppercase tracking-wider">
                      <Pill className="h-4 w-4 text-red-500" />
                      Condiciones crónicas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.chronicConditions.map((c, i) => (
                        <span key={i} className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical history */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink uppercase tracking-wider">
                    <FileText className="h-4 w-4 text-teal-600" />
                    Historial clínico
                    <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-700">
                      {data.recentConsultations.length} consultas
                    </span>
                  </h3>
                  {data.recentConsultations.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Sin consultas registradas</p>
                  ) : (
                    <div className="space-y-2">
                      {data.recentConsultations.map((c) => (
                        <div key={c.id} className="rounded-lg border border-border bg-[#FAFBFC] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              c.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                              c.status === "ACTIVE" ? "bg-teal-100 text-teal-700" :
                              c.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {c.status === "COMPLETED" ? <CheckCircle className="h-3 w-3" /> :
                               c.status === "ACTIVE" ? <Stethoscope className="h-3 w-3" /> :
                               c.status === "CANCELLED" ? <X className="h-3 w-3" /> :
                               <Clock className="h-3 w-3" />}
                              {c.status === "COMPLETED" ? "Completada" :
                               c.status === "ACTIVE" ? "En curso" :
                               c.status === "CANCELLED" ? "Cancelada" : "En espera"}
                            </span>
                            <div className="flex items-center gap-2">
                              {(c as { prescriptionCount?: number }).prescriptionCount != null &&
                               (c as { prescriptionCount?: number }).prescriptionCount! > 0 && (
                                <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                                  <Pill className="h-3 w-3" />
                                  {(c as { prescriptionCount?: number }).prescriptionCount} receta{(c as { prescriptionCount?: number }).prescriptionCount !== 1 ? "s" : ""}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {new Date((c as { createdAt?: string }).createdAt || c.completedAt || "").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-ink leading-5">{c.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
