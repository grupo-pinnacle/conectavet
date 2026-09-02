import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyPets } from "../../services/endpoints";
import Button from "../Button";
import {
  PawPrint,
  Phone,
  Mail,
  Stethoscope,
  UserRound,
  Check,
  Pencil,
  ShieldCheck,
  Calendar,
  FileText
} from "lucide-react";

export default function ProfileSection() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [petCount, setPetCount] = useState<number | null>(null);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setBio(user?.bio ?? "");
    setSpecialty(user?.specialty ?? "");
  }, [user]);

  useEffect(() => {
    getMyPets()
      .then((pets) => setPetCount(pets.length))
      .catch(() => setPetCount(null));
  }, []);

  const isVet = user?.role?.toUpperCase() === "VET";
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const roleLabel = isVet
    ? "Médico Veterinario Matriculado"
    : isAdmin
    ? "Administrador del Sistema"
    : "Tutor Responsable de Mascota";

  const initials = (
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        specialty: isVet ? specialty.trim() || undefined : undefined,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "No pudimos guardar tus cambios.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Banner de encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-teal-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-3xl font-bold text-white border border-white/20 shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.name || "Mi Cuenta"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verificada
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-teal-100/90 font-medium">
                <Stethoscope className="h-4 w-4 text-teal-300" /> {roleLabel}
              </p>
              <p className="mt-1 text-xs text-teal-200/70 font-mono">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-all"
              >
                <Pencil className="h-4 w-4" />
                Editar perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mascotas Vinculadas</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <PawPrint className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{petCount !== null ? petCount : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">Pacientes con historial clínico activo</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Profesional</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {isVet ? "Habilitado SENASA" : "Tutor Activo"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Conforme Ley 25.326 de Protección de Datos</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antigüedad</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {user?.createdAt ? new Date(user.createdAt).getFullYear() : "2026"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Miembro del ecosistema ConectaVet</p>
        </div>
      </div>

      {/* Contenido principal: Ver / Editar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? "Modificar Datos del Perfil" : "Expediente de Usuario"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {editing ? "Actualizá tu información de contacto y credenciales" : "Información visible en la plataforma y recetas"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
            <Check className="h-5 w-5 text-emerald-600" />
            Tus cambios se guardaron correctamente en la base de datos.
          </div>
        )}

        {editing ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Nombre</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Apellido</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Teléfono de contacto</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none transition-colors"
                />
              </div>
              {isVet && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Especialidad veterinaria</label>
                  <input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej: Clínica médica, Dermatología, Felinos..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Biografía / Presentación clínica</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder={isVet ? "Contá sobre tu trayectoria, formación y enfoque de atención..." : "Notas de interés sobre tus mascotas..."}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Guardar cambios
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <UserRound className="h-5 w-5 text-teal-700 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.name || "Sin registrar"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <Mail className="h-5 w-5 text-teal-700 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.email || "Sin registrar"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <Phone className="h-5 w-5 text-teal-700 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono de Contacto</p>
                  <p className="text-sm font-semibold text-slate-900">{user?.phone || "Sin registrar"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {isVet && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <Stethoscope className="h-5 w-5 text-teal-700 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Especialidad</p>
                    <p className="text-sm font-semibold text-slate-900">{user?.specialty || "Clínica General"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <FileText className="h-5 w-5 text-teal-700 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biografía / Presentación</p>
                  <p className="text-sm text-slate-700 leading-relaxed mt-0.5">
                    {user?.bio || "Sin biografía registrada. Podés agregar una descripción tocando 'Editar perfil'."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
