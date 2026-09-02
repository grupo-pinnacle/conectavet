import { useState, useEffect } from "react";
import { getMyPets, createPet, updatePet, getPetById } from "../../services/endpoints";
import type { Pet } from "../../types";
import { PawPrint, FileText, Printer, X } from "lucide-react";
import { formatSex } from "../../utils/sex";

const avatarList = ["🐶", "🐱", "🐩", "🐕", "🐕‍🦺", "🐦", "🐰", "🐹"];

const emptyForm = {
  name: "",
  species: "",
  breed: "",
  age: 1,
  weight: "",
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
  const [selectedPetDossier, setSelectedPetDossier] = useState<Pet | null>(null);

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

  const openDossier = async (petId: string) => {
    try {
      const fullPet = await getPetById(petId);
      setSelectedPetDossier(fullPet);
    } catch {
      alert("No se pudo cargar la ficha de la mascota");
    }
  };

  const handlePrintDossier = (pet: Pet) => {
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
        <title>Ficha Clínica Veterinaria - ${pet.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: bold; color: #0f766e; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .section { margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background: #f8fafc; }
          .section-title { font-size: 14px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin-bottom: 10px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 13px; }
          .label { font-weight: bold; color: #475569; }
          .timeline-item { border-left: 2px solid #0f766e; padding-left: 12px; margin-bottom: 16px; }
          .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">🐾 ConectaVet — Ficha Clínica y Expediente</h1>
            <div class="subtitle">Documento Médico Certificado del Paciente</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Fecha de emisión: ${new Date().toLocaleDateString("es-AR")}<br>
            Paciente: <strong>${pet.name}</strong>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Información General del Paciente</div>
          <div class="grid">
            <div><span class="label">Nombre:</span> ${pet.name}</div>
            <div><span class="label">Especie:</span> ${pet.species || "No especificada"}</div>
            <div><span class="label">Raza:</span> ${pet.breed || "Mestizo / No especificada"}</div>
            <div><span class="label">Edad:</span> ${pet.age} años</div>
            <div><span class="label">Sexo:</span> ${formatSex(pet.sex)}</div>
            <div><span class="label">Peso:</span> ${pet.weight || pet.weightKg || "N/A"} kg</div>
            <div><span class="label">Microchip:</span> ${pet.microchip || "Sin microchip"}</div>
            <div><span class="label">Color:</span> ${pet.color || "N/A"}</div>
            <div><span class="label">Alergias:</span> ${(pet.allergies || []).join(", ") || "Ninguna registrada"}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Condiciones Crónicas y Antecedentes</div>
          <div style="font-size: 13px; color: #334155;">
            ${(pet.chronicConditions || []).join(", ") || "Sin condiciones crónicas preexistentes declaradas."}
          </div>
        </div>

        <div class="footer">
          <div>Expediente digital emitido por ConectaVet según normativas sanitarias.</div>
          <div style="text-align: right;">Válido como constancia clínica del tutor.</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const weight = form.weight === "" ? undefined : Number(form.weight);
    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed,
      age: form.age,
      weight: Number.isNaN(weight) ? undefined : weight,
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
      weight: pet.weight ? String(pet.weight) : "",
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
            <div className="flex gap-4">
              <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Edad</label>
                <input type="number" min={0} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))} className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none" />
              </div>
              <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Peso</label>
                <input type="number" min={0} step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="Ej: 10" className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none" />
              </div>
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
                <p className="font-semibold text-ink">{pet.age} años</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Peso</p>
                <p className="font-semibold text-ink">{pet.weight || pet.weightKg || "N/A"} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Sexo</p>
                <p className="font-semibold text-ink">{formatSex(pet.sex)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Microchip</p>
                <p className="font-semibold text-slate-700 truncate">{pet.microchip || "No registrado"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Próximo control</p>
                <p className="font-semibold text-teal-700">{pet.nextVet || "No agendado"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openDossier(pet.id)}
                className="flex items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                title="Ver expediente clínico completo"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Expediente</span>
              </button>
              <button onClick={() => startEdit(pet)} className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                Editar
              </button>
              <button onClick={() => onAgendarCita?.(pet.id)} className="flex-1 rounded-lg bg-teal-700 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
                Agendar cita
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Expediente Clínico y Timeline */}
      {selectedPetDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-2xl">
                  🐾
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">
                    Expediente Clínico de {selectedPetDossier.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedPetDossier.species} · {selectedPetDossier.breed || "Raza no especificada"} · {selectedPetDossier.age} años
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintDossier(selectedPetDossier)}
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                  title="Imprimir expediente"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setSelectedPetDossier(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400">Sexo</span>
                <p className="font-bold text-ink">{formatSex(selectedPetDossier.sex)}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-400">Peso</span>
                <p className="font-bold text-ink">{selectedPetDossier.weight || selectedPetDossier.weightKg || "N/A"} kg</p>
              </div>
              <div>
                <span className="font-semibold text-slate-400">Microchip</span>
                <p className="font-bold text-ink truncate">{selectedPetDossier.microchip || "No tiene"}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-400">Color</span>
                <p className="font-bold text-ink">{selectedPetDossier.color || "N/A"}</p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">Alergias Conocidas</p>
                <p className="mt-1 text-xs text-ink font-medium">
                  {(selectedPetDossier.allergies || []).join(", ") || "Ninguna alergia registrada."}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Condiciones Crónicas / Antecedentes</p>
                <p className="mt-1 text-xs text-ink font-medium">
                  {(selectedPetDossier.chronicConditions || []).join(", ") || "Sin condiciones crónicas registradas."}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">
                Historial de Consultas Médicas
              </h4>
              {selectedPetDossier.consultations && selectedPetDossier.consultations.length > 0 ? (
                <div className="space-y-3">
                  {selectedPetDossier.consultations.map((c) => (
                    <div key={c.id} className="rounded-xl border border-border p-3.5 bg-white shadow-xs">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-teal-800">
                          {c.vet ? `Dr./Dra. ${c.vet.firstName || c.vet.email}` : "Veterinario de guardia"}
                        </span>
                        <span className="text-slate-400">
                          {new Date(c.endedAt || c.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      {c.notes && <p className="text-xs text-slate-600 italic">"{c.notes}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay consultas finalizadas registradas para esta mascota.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

