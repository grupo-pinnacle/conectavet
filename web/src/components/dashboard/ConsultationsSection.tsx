import { useState } from "react";
import { Star } from "lucide-react";

const allVets = [
  { name: "Dr. Luis López", specialty: "Cardiólogo Veterinario", rating: 4.7, reviews: 120, price: "$1,500", available: true, avatar: "L" },
  { name: "Dra. Sofía Ramirez", specialty: "Dermatóloga Veterinaria", rating: 4.8, reviews: 85, price: "$1,800", available: true, avatar: "S" },
  { name: "Dr. Pablo García", specialty: "Cirujano Veterinario", rating: 4.9, reviews: 200, price: "$2,500", available: false, avatar: "P" },
  { name: "Dra. Ana Torres", specialty: "Oftalmóloga Veterinaria", rating: 4.6, reviews: 65, price: "$1,600", available: true, avatar: "A" },
];

const species = ["Perros", "Gatos", "Aves", "Exóticos"];
const availabilities = ["Hoy", "Esta semana", "Cualquier"];

export default function ConsultationsSection() {
  const [selectedSpecies, setSelectedSpecies] = useState("Perros");
  const [selectedAvail, setSelectedAvail] = useState("Cualquier");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Buscar Veterinario</h1>
        <p className="text-slate-500">Encuentra al especialista ideal para tu mascota</p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Especie</p>
            <div className="flex flex-wrap gap-2">
              {species.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSpecies(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    selectedSpecies === s
                      ? "bg-teal-700 text-white"
                      : "border border-border bg-white text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Disponibilidad</p>
            <div className="flex flex-wrap gap-2">
              {availabilities.map((a) => (
                <button
                  key={a}
                  onClick={() => setSelectedAvail(a)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    selectedAvail === a
                      ? "bg-teal-700 text-white"
                      : "border border-border bg-white text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 sm:ml-auto">
            Filtros
          </button>
        </div>
      </div>

      {/* Vet cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {allVets.map((vet) => (
          <div
            key={vet.name}
            className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 md:h-14 md:w-14 md:text-lg">
                  {vet.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{vet.name}</p>
                  <p className="truncate text-sm text-slate-500">{vet.specialty}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold text-ink">{vet.rating}</span>
                    <span className="hidden text-slate-400 md:inline">({vet.reviews} reseñas)</span>
                  </div>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    vet.available
                      ? "bg-success-bg text-success"
                      : "bg-red-50 text-red-500"
                }`}
              >
                {vet.available ? "Disponible" : "No Disponible"}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between border-t border-[#F1F5F9] pt-4">
              <p className="text-xs text-slate-500 md:text-sm">Costo aprox.</p>
              <p className="text-lg font-bold text-teal-700">{vet.price}</p>
            </div>
            <button
              disabled={!vet.available}
              className={`w-full rounded-lg py-2.5 text-sm font-bold transition-opacity ${
                vet.available
                  ? "bg-teal-700 text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-100 text-slate-400"
              }`}
            >
              Agendar consulta
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
