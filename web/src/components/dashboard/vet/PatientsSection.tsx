import { useState, useEffect } from "react";
import { getManagedPets } from "../../../services/endpoints";
import type { Pet } from "../../../types";
import { Search, PawPrint } from "lucide-react";
import VetPatientProfile from "./VetPatientProfile";
import { formatSex } from "../../../utils/sex";

const avatarList = ["🐶", "🐱", "🐩", "🐕", "🐕‍🦺", "🐦", "🐰", "🐹"];
const species = ["Todos", "Perro", "Gato", "Ave", "Exótico"];

export default function PatientsSection() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("Todos");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedPetName, setSelectedPetName] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getManagedPets();
        setPatients(data);
      } catch {
        setError("No se pudieron cargar los pacientes");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = patients.filter(
    (p) =>
      (filterSpecies === "Todos" || p.species === filterSpecies) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pacientes</h1>
          <p className="text-slate-500">{patients.length} pacientes</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente..."
            className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {species.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSpecies(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filterSpecies === s
                  ? "bg-teal-700 text-white"
                  : "border border-border bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <PawPrint className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">Aún no tenés pacientes</p>
          <p className="text-sm text-slate-500">
            Cuando tomes consultas, los pacientes aparecerán acá.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPetId(p.id); setSelectedPetName(p.name); }}
              className="rounded-xl border border-border bg-white p-5 shadow-sm transition-all text-left hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
                  {avatarList[i % avatarList.length]}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-ink">{p.name}</p>
                  <p className="text-sm text-slate-500">{p.breed || p.species}</p>
                </div>
                {p.age && (
                  <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-slate-500">
                    {p.age} años
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Especie</p>
                  <p className="font-semibold text-ink">{p.species}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Sexo</p>
                  <p className="font-semibold text-ink">{formatSex(p.sex)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Color</p>
                  <p className="font-semibold text-ink">{p.color || "—"}</p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && search && (
            <div className="col-span-full py-10 text-center text-slate-400">
              No se encontraron pacientes con ese nombre
            </div>
          )}
        </div>
      )}
      {selectedPetId && (
        <VetPatientProfile
          petId={selectedPetId}
          petName={selectedPetName}
          onClose={() => setSelectedPetId(null)}
        />
      )}
    </div>
  );
}
