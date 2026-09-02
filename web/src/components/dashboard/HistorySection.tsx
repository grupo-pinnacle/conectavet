import { useState, useEffect, useCallback } from "react";
import { getMyConsultations, rateConsultation } from "../../services/endpoints";
import type { Consultation, Prescription, Review } from "../../types";
import { ClipboardList, Clock, Pill, Star, X, Printer } from "lucide-react";
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

  const handlePrintConsultation = (c: Consultation, rxs: Prescription[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Informe Clínico de Consulta - ${c.pet?.name || "Mascota"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: bold; color: #0f766e; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .section { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background: #f8fafc; }
          .section-title { font-size: 14px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
          .label { font-weight: bold; color: #475569; }
          .rx-box { border: 1px solid #ccfbf1; background: #f0fdfa; border-radius: 6px; padding: 12px; margin-top: 8px; font-size: 13px; }
          .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .sig { text-align: center; width: 220px; border-top: 1px dashed #94a3b8; padding-top: 8px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">🐾 ConectaVet — Resumen de Atención Telemédica</h1>
            <div class="subtitle">Historial Clínico Oficial del Paciente</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Fecha: ${new Date(c.endedAt || c.createdAt).toLocaleDateString("es-AR")}<br>
            ID Consulta: ${c.id.slice(0, 8)}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Paciente y Atención</div>
          <div class="grid">
            <div><span class="label">Mascota:</span> ${c.pet?.name || "N/A"} (${c.pet?.species || "Especie no especificada"})</div>
            <div><span class="label">Veterinario a Cargo:</span> Dr./Dra. ${c.vet?.firstName || c.vet?.email || "N/A"}</div>
            <div><span class="label">Tutor / Dueño:</span> ${c.client?.firstName || c.client?.email || "N/A"}</div>
            <div><span class="label">Fecha de Cierre:</span> ${new Date(c.endedAt || c.createdAt).toLocaleString("es-AR")}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Evolución y Diagnóstico Clínico</div>
          <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${c.notes || "Sin observaciones adicionales registradas."}</div>
        </div>

        ${rxs.length > 0 ? `
        <div class="section">
          <div class="section-title">Prescripciones / Recetas Emitidas (${rxs.length})</div>
          ${rxs.map((rx) => `
            <div class="rx-box">
              ${rx.medication ? `<div><strong>Medicamento:</strong> ${rx.medication} ${rx.dosage ? `— <strong>Dosis:</strong> ${rx.dosage}` : ""}</div>` : ""}
              ${rx.frequency ? `<div><strong>Frecuencia:</strong> ${rx.frequency} ${rx.durationDays ? `— <strong>Duración:</strong> ${rx.durationDays} días` : ""}</div>` : ""}
              ${rx.indications ? `<div><strong>Indicaciones:</strong> ${rx.indications}</div>` : ""}
              <div style="margin-top: 6px; color: #334155;">${rx.content}</div>
            </div>
          `).join("")}
        </div>
        ` : ""}

        <div class="footer">
          <div>Documento emitido digitalmente vía plataforma ConectaVet.</div>
          <div class="sig">
            <strong>Dr./Dra. ${c.vet?.firstName || "Médico Veterinario"}</strong><br>
            <span style="font-size: 11px;">Firma & Sello de Atención</span>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

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

  const [selectedPetId, setSelectedPetId] = useState<string>("ALL");

  const petsList = Array.from(
    new Map(
      completed
        .filter((c) => c.pet)
        .map((c) => [c.pet!.id, c.pet!.name])
    ).entries()
  );

  const filteredCompleted = selectedPetId === "ALL"
    ? completed
    : completed.filter((c) => c.petId === selectedPetId);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Historial clínico y Timeline</h1>
          <p className="text-slate-500">
            {completed.length} consulta{completed.length !== 1 ? "s" : ""} médica{completed.length !== 1 ? "s" : ""} registrada{completed.length !== 1 ? "s" : ""}
          </p>
        </div>
        {petsList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filtrar por mascota:</span>
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-ink focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 shadow-sm"
            >
              <option value="ALL">Todas las mascotas ({completed.length})</option>
              {petsList.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {filteredCompleted.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <ClipboardList className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">Aún no hay historial</p>
          <p className="text-sm text-slate-500">
            Las consultas finalizadas aparecerán en una línea de tiempo cronológica con sus recetas y diagnósticos.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-2 before:w-0.5 before:bg-teal-200">
          {filteredCompleted.map((c) => (
            <div
              key={c.id}
              className="relative rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-teal-700 shadow" />
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintConsultation(c, prescriptionsByCons[c.id] || [])}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                    title="Imprimir resumen médico de esta consulta"
                  >
                    <Printer className="h-3.5 w-3.5 text-teal-700" />
                    <span className="hidden sm:inline">Imprimir Informe</span>
                  </button>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(c.endedAt || c.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
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
                    <p className="mt-1 text-sm font-semibold text-ink">{c.review.rating}/5</p>
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
              <p className="mt-1 text-center text-xs text-slate-500">{rating}/5</p>
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
