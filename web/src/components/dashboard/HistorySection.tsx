import { useState, useEffect } from "react";
import { getMyConsultations, getPrescriptions } from "../../services/endpoints";
import type { Consultation, Prescription } from "../../types";
import { ClipboardList, Clock, Pill } from "lucide-react";

export default function HistorySection() {
  const [completed, setCompleted] = useState<Consultation[]>([]);
  const [prescriptionsByCons, setPrescriptionsByCons] = useState<Record<string, Prescription[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMyConsultations();
        const done = data.filter((c) => c.status === "COMPLETED");
        setCompleted(done);
        const lists = await Promise.all(
          done.map((c) =>
            getPrescriptions(c.id).catch(() => [] as Prescription[])
          )
        );
        const byCons: Record<string, Prescription[]> = {};
        done.forEach((c, i) => { byCons[c.id] = lists[i] || []; });
        setPrescriptionsByCons(byCons);
      } catch {
        setError("No se pudo cargar el historial");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Historial clínico</h1>
          <p className="text-slate-500">
            {completed.length} consulta{completed.length !== 1 ? "s" : ""} finalizada{completed.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {completed.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <ClipboardList className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">Aún no hay historial</p>
          <p className="text-sm text-slate-500">
            Las consultas finalizadas aparecerán acá con las notas del veterinario.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                    {c.pet?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{c.pet?.name || "Mascota"}</p>
                    <p className="text-xs text-slate-500">
                      {c.vet?.firstName || c.vet?.email || "Veterinario"}
                    </p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  <Clock className="h-3 w-3" />
                  {new Date(c.endedAt || c.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {c.notes ? (
                <div className="rounded-lg bg-[#F1F5F9] p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Notas del veterinario
                  </p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{c.notes}</p>
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">Sin notas registradas</p>
              )}
              {(prescriptionsByCons[c.id] || []).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" /> Recetas / tratamiento
                  </p>
                  {(prescriptionsByCons[c.id] || []).map((rx) => (
                    <div key={rx.id} className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                      <p className="text-sm text-ink whitespace-pre-wrap">{rx.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
