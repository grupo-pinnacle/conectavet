import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Star, Heart, Stethoscope, MessageCircle, Wifi, WifiOff, UserRound } from "lucide-react";
import {
  listVets,
  getVetById,
  addFavorite,
  removeFavorite,
  createConsultation,
  getMyPets,
} from "../../services/endpoints";
import type { VetSummary } from "../../services/endpoints";
import { onDataChanged } from "../../services/realtime";
import Button from "../Button";
import type { Pet } from "../../types";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client?: { firstName?: string | null; lastName?: string | null };
}

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number | null; size?: string }) {
  if (value == null) {
    return <span className="text-xs text-slate-400">Sin calificaciones</span>;
  }
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-px" aria-label={`Calificación ${value} de 10`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= rounded ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

export default function DirectorySection() {
  const [vets, setVets] = useState<VetSummary[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "recent">("rating");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, Review[] | null>>({});
  const [loadingReviews, setLoadingReviews] = useState<string | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Modal de consulta
  const [consultVet, setConsultVet] = useState<VetSummary | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [consultError, setConsultError] = useState("");
  const [consultSuccess, setConsultSuccess] = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current!);
    searchTimer.current = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(searchTimer.current!);
  }, [search]);

  const fetchVets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listVets({
        search: debounced || undefined,
        onlineOnly: onlineOnly || undefined,
        minRating: minRating || undefined,
        sortBy,
      });
      setVets(data);
    } catch {
      setError("No se pudo cargar la lista de veterinarios");
    } finally {
      setLoading(false);
    }
  }, [debounced, onlineOnly, minRating, sortBy]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar
    fetchVets();
  }, [fetchVets]);

  // Tiempo real: refresca cuando un vet cambia disponibilidad (vet:availability)
  useEffect(() => onDataChanged(fetchVets), [fetchVets]);

  const toggleExpand = useCallback(async (vet: VetSummary) => {
    if (expanded[vet.id] !== undefined) {
      setExpanded((prev) => ({ ...prev, [vet.id]: prev[vet.id] ? null : prev[vet.id] }));
      return;
    }
    setLoadingReviews(vet.id);
    try {
      const detail = await getVetById(vet.id);
      setExpanded((prev) => ({ ...prev, [vet.id]: detail.reviews ?? [] }));
    } catch {
      setExpanded((prev) => ({ ...prev, [vet.id]: [] }));
    } finally {
      setLoadingReviews(null);
    }
  }, [expanded]);

  const toggleFavorite = useCallback(async (vet: VetSummary) => {
    setFavoriteBusy(vet.id);
    try {
      if (vet.isFavorite) {
        await removeFavorite(vet.id);
      } else {
        await addFavorite(vet.id);
      }
      setVets((prev) =>
        prev.map((v) => (v.id === vet.id ? { ...v, isFavorite: !vet.isFavorite } : v))
      );
    } catch {
      setError("No se pudo actualizar el favorito");
    } finally {
      setFavoriteBusy(null);
    }
  }, []);

  const openConsult = useCallback(async (vet: VetSummary) => {
    setConsultVet(vet);
    setConsultError("");
    setConsultSuccess("");
    setSelectedPetId("");
    setNotes("");
    try {
      const myPets = await getMyPets();
      setPets(myPets);
    } catch {
      setPets([]);
    }
  }, []);

  const handleConsult = useCallback(async () => {
    if (!consultVet || !selectedPetId) return;
    if (!notes.trim() || notes.trim().length < 5) {
      setConsultError("Contanos el motivo de la consulta (mínimo 5 caracteres)");
      return;
    }
    setCreating(true);
    setConsultError("");
    try {
      await createConsultation({ petId: selectedPetId, notes: notes.trim(), vetId: consultVet.id });
      setConsultSuccess(
        `Tu consulta se envió a ${consultVet.firstName || consultVet.email}. Te avisamos cuando la acepte.`
      );
      setNotes("");
      setSelectedPetId("");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setConsultError(msg || "No se pudo enviar la consulta");
    } finally {
      setCreating(false);
    }
  }, [consultVet, selectedPetId, notes]);

  const vetName = (v: VetSummary) =>
    `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.email;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Buscar veterinarios</h1>
        <p className="text-slate-500">Elegí al profesional y pedí una consulta directamente</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {/* Filtros */}
      <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o especialidad..."
              className="w-full rounded-lg border border-border pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="h-4 w-4 accent-teal-700"
              />
              Solo online
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-lg border border-border px-3 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none"
              aria-label="Calificación mínima"
            >
              <option value={0}>Cualquier calificación</option>
              <option value={8}>8+ estrellas</option>
              <option value={9}>9+ estrellas</option>
              <option value={10}>10 estrellas</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "recent")}
              className="rounded-lg border border-border px-3 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none"
              aria-label="Ordenar por"
            >
              <option value="rating">Mejor calificados</option>
              <option value="recent">Más recientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : vets.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <Stethoscope className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">No encontramos veterinarios</p>
          <p className="text-sm text-slate-500">Probá ajustar los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vets.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">
                  {(v.firstName || v.email || "V").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-bold text-ink">{vetName(v)}</p>
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                      <Stars value={v.ratingAvg} size="h-3.5 w-3.5" />
                      {v.ratingCount > 0 && (
                        <span className="text-xs text-slate-400">({v.ratingCount})</span>
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {v.specialty || "Medicina general"}
                  </p>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${v.isOnline ? "text-green-600" : "text-slate-400"}`}>
                    {v.isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                    {v.isOnline ? "Disponible ahora" : "No disponible"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(v)}
                    disabled={favoriteBusy === v.id}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-slate-400 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    title={v.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                    aria-label={v.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <Heart
                      className={`h-4 w-4 ${v.isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </button>
                  <Button
                    size="sm"
                    fullWidth={false}
                    onClick={() => openConsult(v)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Consultar
                  </Button>
                </div>
              </div>

              <button
                onClick={() => toggleExpand(v)}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
              >
                <UserRound className="h-3.5 w-3.5" />
                {expanded[v.id] !== undefined && expanded[v.id] !== null
                  ? expanded[v.id]!.length > 0
                    ? "Ocultar opiniones"
                    : "Sin opiniones todavía"
                  : loadingReviews === v.id
                    ? "Cargando opiniones..."
                    : "Ver opiniones"}
              </button>

              {expanded[v.id] !== undefined && expanded[v.id] !== null && expanded[v.id]!.length > 0 && (
                <div className="mt-3 space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  {expanded[v.id]!.map((r) => (
                    <div key={r.id} className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          {r.client?.firstName || r.client?.lastName || "Cliente"}
                          <Stars value={r.rating} size="h-3 w-3" />
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de consulta */}
      {consultVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="mb-1 text-lg font-bold text-ink">
              Consultar a {vetName(consultVet)}
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Elegí la mascota y contanos el motivo. El veterinario decide si te atiende.
            </p>

            {consultSuccess ? (
              <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
                {consultSuccess}
              </div>
            ) : pets.length === 0 ? (
              <p className="text-sm text-slate-500">
                Primero registrá una mascota en la sección "Mascotas" para poder consultar.
              </p>
            ) : (
              <>
                {consultError && (
                  <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">
                    {consultError}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
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
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Motivo de la consulta
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Mi gato no come desde ayer y está decaído..."
                      rows={3}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => setConsultVet(null)}
              >
                {consultSuccess ? "Cerrar" : "Cancelar"}
              </Button>
              {!consultSuccess && pets.length > 0 && (
                <Button
                  size="md"
                  fullWidth={false}
                  disabled={!selectedPetId}
                  loading={creating}
                  onClick={handleConsult}
                >
                  Enviar consulta
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
