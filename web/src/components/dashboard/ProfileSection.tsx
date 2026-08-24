import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyPets } from "../../services/endpoints";
import Button from "../Button";
import { PawPrint, Phone, Mail, Stethoscope, UserRound, Check, Pencil } from "lucide-react";

export default function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [petCount, setPetCount] = useState<number | null>(null);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  useEffect(() => {
    getMyPets()
      .then((pets) => setPetCount(pets.length))
      .catch(() => setPetCount(null));
  }, []);

  const roleLabel = user?.role === "vet" ? "Veterinario/a" : user?.role === "admin" ? "Administrador" : "Dueño de mascota";
  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as { message?: string })?.message
        || "No pudimos guardar tus cambios.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>
        <p className="text-slate-500">Información personal y configuración</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar card */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm md:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-3xl font-bold text-white shadow-subtle">
              {initials}
            </div>
            <p className="text-xl font-bold text-ink">{user?.name || "Usuario"}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Stethoscope className="h-3.5 w-3.5" /> {roleLabel}
            </span>
            {petCount !== null && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                <PawPrint className="h-4 w-4 text-teal-600" /> {petCount} mascota{petCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        {/* Info / edit */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">Información personal</h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} icon={<Pencil className="h-3.5 w-3.5" />}>
                Editar
              </Button>
            )}
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
              <Check className="h-4 w-4" /> Cambios guardados
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Apellido</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Teléfono</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>Guardar cambios</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Nombre completo", value: user?.name || "—", icon: <UserRound className="h-4 w-4 text-teal-600" /> },
                { label: "Correo electrónico", value: user?.email || "—", icon: <Mail className="h-4 w-4 text-teal-600" /> },
                { label: "Teléfono", value: user?.phone || "Sin registrar", icon: <Phone className="h-4 w-4 text-teal-600" /> },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center gap-2">
                    {field.icon}
                    <div>
                      <p className="text-xs text-slate-400">{field.label}</p>
                      <p className="font-semibold text-ink">{field.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
