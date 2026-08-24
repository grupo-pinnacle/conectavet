import { useState, useEffect, useCallback } from "react";
import { getMyConsultations, rateConsultation } from "../../services/endpoints";
import type { Consultation, Prescription, Review } from "../../types";
import { ClipboardList, Clock, Pill, Star, X } from "lucide-react";
import StarRatingInput from "./StarRatingInput";
import Button from "../Button";

export default function HistorySection() {
  const [completed, setCompleted] = useState<Consultation[]>([]);
  const [prescriptionsByCons, setPrescriptionsByCons] = useState<Record<string, Prescription[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal de calificación
  const [rateTarget, setRateTarget] = useState<Consultation | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rateError, setRateError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await getMyConsultations();
      const done = data.filter((c) => c.status === "COMPLETED");
      setCompleted(done);
      const byCons: Record<string, Prescription[]> = {};
      done.forEach((c) => { byCons[c.id] = c.prescriptions ?? []; });
      setPrescriptionsByCons(byCons);
    } catch {
      setError("No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRate = (c: Consultation) => {
    setRateTarget(c);
    setRating(0);
    setComment("");
    setRateError("");
  };

  const submitRate = async () => {
    if (!rateTarget) return;
    if (rating === 0 || comment.trim().length < 10) {
      setRateError("Calificá con al menos 1 estrella y escribí tu opinión (mínimo 10 caracteres).");
      return;
    }
    setSubmitting(true);
    setRateError("");
    try {
      const review: Review = await rateConsultation(rateTarget.id, { rating, comment: comment.trim() });
      setCompleted((prev) => prev.map((c) => (c.id === rateTarget.id ? { ...c, review } : c)));
      setRateTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message
        || "No pudimos guardar tu calificación.";
      setRateError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
                  {(prescriptionsByCons[c.id] || []).map((rx) => {
                    const hasDetails = rx.medication || rx.dosage || rx.frequency || rx.durationDays || rx.indications;
                    return (
                      <div key={rx.id} className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                        {hasDetails && (
                          <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-teal-100 bg-white/70 p-2.5 text-xs">
                            {rx.medication && (
                              <p><span className="font-bold text-teal-800">Medicación:</span> {rx.medication}</p>
                            )}
                            {rx.dosage && (
                              <p><span className="font-bold text-teal-800">Dosis:</span> {rx.dosage}</p>
                            )}
                            {rx.frequency && (
                              <p><span className="font-bold text-teal-800">Frecuencia:</span> {rx.frequency}</p>
                            )}
                            {rx.durationDays && (
                              <p><span className="font-bold text-teal-800">Duración:</span> {rx.durationDays} días</p>
                            )}
                            {rx.indications && (
                              <p className="col-span-2"><span className="font-bold text-teal-800">Indicaciones:</span> {rx.indications}</p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-ink whitespace-pre-wrap">{rx.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Calificación del dueño */}
              {c.review ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Tu calificación</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{c.review.rating}/10</p>
                    {c.review.comment && <p className="mt-1 text-sm text-ink whitespace-pre-wrap">{c.review.comment}</p>}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openRate(c)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                >
                  <Star className="h-4 w-4" /> Calificar consulta
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de calificación */}
      {rateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setRateTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Calificá a {rateTarget.vet?.firstName || "el veterinario"}</h3>
                <p className="text-xs text-slate-500">Tu opinión es obligatoria (mínimo 10 caracteres).</p>
              </div>
              <button
                onClick={() => setRateTarget(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <StarRatingInput value={rating} onChange={setRating} />
              <p className="mt-1 text-center text-xs text-slate-500">{rating}/10</p>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="¿Por qué le das esa calificación? (obligatorio, mín. 10 caracteres)"
              className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 ${
                comment.length > 0 && comment.trim().length < 10
                  ? "border-red-300 focus:ring-red-200"
                  : "border-border focus:ring-teal-200"
              }`}
            />
            {comment.length > 0 && comment.trim().length < 10 && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                Faltan {10 - comment.trim().length} caracteres más.
              </p>
            )}

            {rateError && <p className="mt-3 text-sm font-semibold text-red-600">{rateError}</p>}

            <div className="mt-5 flex gap-3">
              <Button variant="outline" fullWidth={false} className="flex-1" onClick={() => setRateTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth={false}
                className="flex-1"
                loading={submitting}
                disabled={rating === 0 || comment.trim().length < 10}
                onClick={submitRate}
              >
                Enviar calificación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
