import { useState, useEffect } from "react";
import { getMyPets, createPet } from "../../services/endpoints";
import type { Pet } from "../../types";

const avatarList = ["🐶", "🐱", "🐩", "🐕", "🐕‍🦺", "🐦", "🐰", "🐹"];

export default function PetsSection() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", species: "", breed: "", age: 1, weight: "" });
  const [saving, setSaving] = useState(false);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const data = await getMyPets();
      setPets(data);
    } catch {
      setError("No se pudieron cargar tus mascotas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const newPet = await createPet(form);
      setPets((prev) => [...prev, newPet]);
      setShowForm(false);
      setForm({ name: "", species: "", breed: "", age: 1, weight: "" });
    } catch {
      setError("Error al crear mascota");
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-[#0F172A]">Mis mascotas</h1>
          <p className="text-[#475569]">{pets.length} mascota{pets.length !== 1 ? "s" : ""} registrada{pets.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-5"
        >
          + Agregar mascota
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-[#2563EB]/30 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A]">Nueva mascota</h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Especie</label>
              <select value={form.species} onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Exótico">Exótico</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Raza</label>
              <input type="text" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} placeholder="Raza" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Edad</label>
                <input type="number" min={0} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">Peso</label>
                <input type="text" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="Ej: 10 kg" className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#CBD5E1] px-6 py-2.5 text-sm font-semibold text-[#475569] hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 && !showForm && (
        <div className="rounded-xl border border-[#CBD5E1] bg-white p-10 text-center shadow-sm">
          <p className="text-4xl">🐾</p>
          <p className="mt-4 text-lg font-bold text-[#0F172A]">Aún no tenés mascotas registradas</p>
          <p className="text-sm text-[#475569]">Agregá tu primera mascota para empezar.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            + Agregar mascota
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet, i) => (
          <div key={pet.id} className="rounded-xl border border-[#CBD5E1] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
                {avatarList[i % avatarList.length]}
              </div>
              <div>
                <p className="text-xl font-bold text-[#0F172A]">{pet.name}</p>
                <p className="text-sm text-[#475569]">{pet.breed || pet.species}</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 border-t border-[#F1F5F9] pt-4">
              <div>
                <p className="text-xs text-[#94A3B8]">Especie</p>
                <p className="font-semibold text-[#0F172A]">{pet.species}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Edad</p>
                <p className="font-semibold text-[#0F172A]">{pet.age} años</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Peso</p>
                <p className="font-semibold text-[#0F172A]">{pet.weight}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Próximo control</p>
                <p className="font-semibold text-[#2563EB]">{pet.nextVet || "No agendado"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-[#CBD5E1] py-2 text-sm font-semibold text-[#475569] hover:bg-gray-50">
                Editar
              </button>
              <button className="flex-1 rounded-lg bg-[#2563EB] py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Agendar cita
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
