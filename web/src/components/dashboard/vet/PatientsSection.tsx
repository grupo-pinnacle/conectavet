import { useState, useEffect } from "react";
import { getAllPets } from "../../../services/endpoints";
import type { Pet } from "../../../types";

const avatarList = ["🐶", "🐱", "🐩", "🐕", "🐕‍🦺", "🐦", "🐰", "🐹"];

const species = ["Todos", "Perro", "Gato", "Ave", "Exótico"];

export default function PatientsSection() {
  const [patients, setPatients] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("Todos");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getAllPets();
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
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.ownerName || "").toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Pacientes</h1>
          <p className="text-[#475569]">{patients.length} pacientes registrados</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente o dueño..."
            className="w-full rounded-lg border border-[#CBD5E1] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {species.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSpecies(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filterSpecies === s
                  ? "bg-[#2563EB] text-white"
                  : "border border-[#CBD5E1] bg-white text-[#475569] hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm transition-colors hover:bg-gray-50">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
                {avatarList[i % avatarList.length]}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-[#0F172A]">{p.name}</p>
                <p className="text-sm text-[#475569]">{p.breed || p.species}</p>
              </div>
              <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#475569]">
                {p.age} años
              </span>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-4 text-sm">
              <div>
                <p className="text-xs text-[#94A3B8]">Dueño</p>
                <p className="font-semibold text-[#0F172A]">{p.ownerName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Peso</p>
                <p className="font-semibold text-[#0F172A]">{p.weight || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Última visita</p>
                <p className="font-semibold text-[#0F172A]">{p.lastVisit || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Próxima visita</p>
                <p className="font-semibold text-[#2563EB]">{p.nextVet || "—"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-[#CBD5E1] py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
                Historial
              </button>
              <button className="flex-1 rounded-lg bg-[#2563EB] py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Nueva consulta
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-10 text-center text-[#94A3B8]">
            No se encontraron pacientes
          </div>
        )}
      </div>
    </div>
  );
}
