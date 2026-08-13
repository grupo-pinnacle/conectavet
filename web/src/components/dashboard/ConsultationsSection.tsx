import { useState, useEffect, useCallback } from "react";
import { createConsultation, getMyPets, getMyConsultations } from "../../services/endpoints";
import { onDataChanged } from "../../services/realtime";
import type { Pet } from "../../types";
import { Calendar, PawPrint, Clock, CheckCircle } from "lucide-react";
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
          .filter((c) => c.status !== "COMPLETED")
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

  // Refresca la lista cuando el dashboard recibe un evento de socket
  // (consulta nueva/actualizada/notificación) sin necesidad de polling.
  useEffect(() => onDataChanged(loadData), [loadData]);

  const handleCreate = async () => {
    if (!selectedPetId) return;
    if (notes.trim().length < 5) { setError("Contanos el motivo de la consulta (mínimo 5 caracteres)"); return; }
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
      setSuccess("Consulta solicitada. Un veterinario la tomará en breve.");
      setSelectedPetId("");
      setNotes("");
    } catch {
      setError("Error al crear la consulta");
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Consultas</h1>
        <p className="text-slate-500">
          Solicitá una consulta para tu mascota
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
          {success}
        </div>
      )}

      {/* Nueva consulta */}
      <div className="mb-8 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-ink">
          <Calendar className="mr-2 inline h-5 w-5 text-teal-700" />
          Solicitar nueva consulta
        </h3>
        {pets.length === 0 ? (
          <p className="text-sm text-slate-500">
            Primero registrá una mascota en la sección "Mascotas".
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
                Motivo de la consulta
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Mi perro no quiere comer desde ayer y tiene fiebre..."
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
              Solicitar consulta
            </Button>
          </div>
        )}
      </div>

      {/* Consultas activas */}
      <h3 className="mb-4 text-lg font-bold text-ink">Tus consultas</h3>
      {activeConsultations.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <PawPrint className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">
            No tenés consultas activas
          </p>
          <p className="text-sm text-slate-500">
            Solicité una consulta para tu mascota y un veterinario la tomará.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeConsultations.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl">
                <PawPrint className="h-6 w-6 text-teal-700" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink">{c.petName}</p>
                <p className="text-sm text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {c.status === "WAITING" && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <Clock className="h-3.5 w-3.5" /> Esperando veterinario
                </span>
              )}
              {c.status === "ACTIVE" && (
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" /> En consulta
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
