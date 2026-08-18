import { useState, useEffect } from "react";
import { getMyPets, createPet, updatePet } from "../../services/endpoints";
import type { Pet } from "../../types";
import { PawPrint } from "lucide-react";
import { formatSex } from "../../utils/sex";

function computeAge(birthDate: string): string | null {
  const birth = new Date(birthDate);
  const now = new Date();
  if (isNaN(birth.getTime()) || birth > now) return null;
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} mes${rem !== 1 ? "es" : ""}`;
  if (rem === 0) return `${years} año${years !== 1 ? "s" : ""}`;
  return `${years} año${years !== 1 ? "s" : ""} y ${rem} mes${rem !== 1 ? "es" : ""}`;
}

const avatarList = ["🐶", "🐱", "🐩", "🐕", "🐕‍🦺", "🐦", "🐰", "🐹"];

const emptyForm = {
  name: "",
  species: "",
  breed: "",
  age: 1,
  sex: "",
  color: "",
  microchip: "",
  birthDate: "",
  weightKg: "",
  allergies: "",
  chronicConditions: "",
};

export default function PetsSection({ onAgendarCita }: { onAgendarCita?: (petId: string) => void }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [form, setForm] = useState(emptyForm);
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
    const computedAge = form.birthDate ? (() => {
      const b = new Date(form.birthDate);
      const now = new Date();
      let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
      if (now.getDate() < b.getDate()) m--;
      return m >= 0 ? Math.floor(m / 12) : undefined;
    })() : undefined;
    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed,
      age: computedAge,
      sex: form.sex || undefined,
      color: form.color || undefined,
      microchip: form.microchip || undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
      chronicConditions: form.chronicConditions.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingPet) {
        const updated = await updatePet(editingPet.id, payload);
        setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const newPet = await createPet(payload);
        setPets((prev) => [...prev, newPet]);
      }
      setShowForm(false);
      setEditingPet(null);
      setForm(emptyForm);
    } catch {
      setError("Error al guardar la mascota");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age ?? 1,
      sex: pet.sex || "",
      color: pet.color || "",
      microchip: pet.microchip || "",
      birthDate: pet.birthDate ? pet.birthDate.slice(0, 10) : "",
      weightKg: pet.weightKg ? String(pet.weightKg) : "",
      allergies: (pet.allergies || []).join(", "),
      chronicConditions: (pet.chronicConditions || []).join(", "),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPet(null);
    setForm(emptyForm);
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
      <div className="mb-6 flex items-start justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis mascotas</h1>
          <p className="text-slate-500">{pets.length} mascota{pets.length !== 1 ? "s" : ""} registrada{pets.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-5"
        >
          + Agregar mascota
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-teal-700/30 bg-teal-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-ink">
            {editingPet ? `Editar ${editingPet.name}` : "Nueva mascota"}
          </h3>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Especie</label>
              <select value={form.species} onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Exótico">Exótico</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Raza</label>
              <input type="text" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} placeholder="Raza" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Sexo</label>
              <select value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="MALE">Macho</option>
                <option value="FEMALE">Hembra</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha de nacimiento</label>
              <input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none" />
              {form.birthDate && (() => {
                const age = computeAge(form.birthDate);
                return age ? (
                  <p className="mt-1 text-xs text-slate-400">{age}</p>
                ) : null;
              })()}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Peso (kg)</label>
              <input type="number" step="0.1" min={0} value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} placeholder="Ej: 8.5" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Color</label>
              <input type="text" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Ej: Marrón" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Microchip</label>
              <input type="text" value={form.microchip} onChange={(e) => setForm((f) => ({ ...f, microchip: e.target.value }))} placeholder="15 dígitos" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Alergias</label>
              <input type="text" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} placeholder="Separadas por coma" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Condiciones crónicas</label>
              <input type="text" value={form.chronicConditions} onChange={(e) => setForm((f) => ({ ...f, chronicConditions: e.target.value }))} placeholder="Separadas por coma" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {saving ? "Guardando..." : editingPet ? "Guardar cambios" : "Guardar"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 && !showForm && (
        <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <PawPrint className="mx-auto h-10 w-10 text-teal-700" />
          <p className="mt-4 text-lg font-bold text-ink">Aún no tenés mascotas registradas</p>
          <p className="text-sm text-slate-500">Agregá tu primera mascota para empezar.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            + Agregar mascota
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet, i) => (
          <div key={pet.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
                {avatarList[i % avatarList.length]}
              </div>
              <div>
                <p className="text-xl font-bold text-ink">{pet.name}</p>
                <p className="text-sm text-slate-500">{pet.breed || pet.species}</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 border-t border-[#F1F5F9] pt-4">
              <div>
                <p className="text-xs text-slate-400">Especie</p>
                <p className="font-semibold text-ink">{pet.species}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Edad</p>
                <p className="font-semibold text-ink">{pet.birthDate ? computeAge(pet.birthDate) ?? `${pet.age ?? "—"} años` : `${pet.age ?? "—"} años`}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Peso</p>
                <p className="font-semibold text-ink">{pet.weightKg ? `${pet.weightKg} kg` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Sexo</p>
                <p className="font-semibold text-ink">{formatSex(pet.sex)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Próximo control</p>
                <p className="font-semibold text-teal-700">{pet.nextVet || "No agendado"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(pet)} className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                Editar
              </button>
              <button onClick={() => onAgendarCita?.(pet.id)} className="flex-1 rounded-lg bg-teal-700 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Agendar cita
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
