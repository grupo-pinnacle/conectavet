import { useState, useEffect, useCallback } from "react";
import { createConsultation, getMyPets, getMyConsultations } from "../../services/endpoints";
import { onDataChanged } from "../../services/realtime";
import type { Pet } from "../../types";
import { Calendar, PawPrint, Clock, CheckCircle, AlertCircle, Sparkles, Stethoscope } from "lucide-react";
import Button from "../Button";

interface ConsultationStatus {
  id: string;
  petId: string;
  status: string;
  petName: string;
  createdAt: string;
}

export default function ConsultationsSection({ initialPetId = "" }: { initialPetId?: string }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activeConsultations, setActiveConsultations] = useState<ConsultationStatus[]>([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [petsData, consData] = await Promise.all([
        getMyPets(),
        getMyConsultations(),
      ]);
      setPets(petsData);
      setActiveConsultations(
        consData
          .filter((c) => c.status !== "COMPLETED" && c.status !== "CANCELLED")
          .map((c) => ({
            id: c.id,
            petId: c.petId,
            status: c.status,
            petName: c.pet?.name || "Mascota",
            createdAt: c.createdAt,
          }))
      );
    } catch {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => onDataChanged(loadData), [loadData]);

  const handleCreate = async () => {
    if (creating) return;
    if (!selectedPetId) return;
    if (notes.trim().length < 5) {
      setError("Contanos el motivo de la consulta (mínimo 5 caracteres)");
      return;
    }
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const cons = await createConsultation({ petId: selectedPetId, notes: notes.trim() });
      setActiveConsultations((prev) => [
        {
          id: cons.id,
          petId: cons.petId,
          status: cons.status,
          petName: cons.pet?.name || "Mascota",
          createdAt: cons.createdAt,
        },
        ...prev,
      ]);
      setSuccess("Consulta solicitada. Tu caso ya está en la cola de atención profesional.");
      setSelectedPetId("");
      setNotes("");
    } catch (err: unknown) {
      const response = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      setError(response?.data?.message || "Error al crear la consulta");
      if (response?.status === 409) loadData();
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  const waitingConsultation = activeConsultations.find((c) => c.status === "WAITING" || c.status === "PENDING");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Consultas Médicas</h1>
        <p className="text-slate-500">
          Atención veterinaria en tiempo real con profesionales matriculados
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Live Queue / Triage Smart Banner */}
      {waitingConsultation && (
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 p-6 text-white shadow-xl relative border border-teal-500/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Sala de Espera Activa · Triage ConectaVet
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Estamos asignando un veterinario para {waitingConsultation.petName}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                <span>Tiempo estimado de espera: <strong>2 a 4 minutos</strong></span>
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10 text-xs max-w-sm">
              <p className="font-semibold text-teal-200 flex items-center gap-1 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> Recomendación clínica mientras esperás:
              </p>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                Mantené a tu mascota tranquila, con agua fresca disponible y tené a mano su peso aproximado y antecedentes de medicación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nueva consulta */}
      <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-ink flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-700" />
          Solicitar nueva consulta
        </h3>
        {pets.length === 0 ? (
          <p className="text-sm text-slate-500">
            Primero registrá una mascota en la sección "Mascotas" para poder solicitar una consulta.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mascota
              </label>
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none"
              >
                <option value="">Seleccionar mascota</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Motivo de la consulta / Síntomas observados
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Mi perro no quiere comer desde ayer, tiene decaimiento y presentó vómitos..."
                rows={2}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
              />
            </div>
            <Button
              disabled={!selectedPetId}
              loading={creating}
              onClick={handleCreate}
              fullWidth={false}
            >
              Ingresar a la sala de consulta
            </Button>
          </div>
        )}
      </div>

      {/* Consultas activas */}
      <h3 className="mb-4 text-lg font-bold text-ink">Tus consultas en curso</h3>
      {activeConsultations.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <PawPrint className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">
            No tenés consultas activas en este momento
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Solicitá una consulta cuando tu mascota lo necesite y un profesional matriculado te atenderá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeConsultations.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:border-teal-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl shrink-0">
                <PawPrint className="h-6 w-6 text-teal-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink truncate">{c.petName}</p>
                <p className="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {c.status === "WAITING" && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 shrink-0">
                  <Clock className="h-3.5 w-3.5" /> En espera de veterinario
                </span>
              )}
              {c.status === "PENDING" && (
                <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 shrink-0">
                  <Stethoscope className="h-3.5 w-3.5" /> Veterinario asignado
                </span>
              )}
              {c.status === "ACTIVE" && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 shrink-0">
                  <CheckCircle className="h-3.5 w-3.5" /> En atención activa
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
