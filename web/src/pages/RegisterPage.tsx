import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, Syringe, UserPlus } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/input";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "vet" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const PASSWORD_REQUIREMENTS: { label: string; test: (p: string) => boolean }[] = [
    { label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
    { label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
    { label: "Una letra minúscula", test: (p) => /[a-z]/.test(p) },
    { label: "Un número", test: (p) => /\d/.test(p) },
    { label: "Un carácter especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const validatePassword = (p: string) => {
    const failed = PASSWORD_REQUIREMENTS.filter((req) => !req.test(p)).map((req) => req.label);
    return failed.length ? `La contraseña debe tener: ${failed.join(", ")}` : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setConfirmError("");

    if (!role) { setError("Seleccioná si sos dueño de mascota o veterinario"); return; }
    if (!name.trim()) { setError("Ingresá tu nombre completo"); return; }
    if (!email.trim()) { setError("Ingresá tu correo electrónico"); return; }
    if (role === "vet" && !licenseNumber.trim()) {
      setError("La matrícula profesional es obligatoria para registrarse como veterinario");
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) { setPasswordError(pwdError); setError(pwdError); return; }
    if (password !== confirmPassword) { setConfirmError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      const formattedSpecialty = role === "vet"
        ? (licenseNumber.trim() ? `${specialty.trim() || "General"} (Mat. ${licenseNumber.trim()})` : specialty.trim())
        : undefined;
      await register(name, email, password, role, formattedSpecialty);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string } | null)?.response?.data?.message
        || (err as { message?: string } | null)?.message
        || "Error al crear la cuenta. Intentá de nuevo.";
      console.error("Register error:", err);
      setError(msg);
      setLoading(false);
      return;
    }
    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface font-sans">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[24rem] w-[24rem] rounded-full bg-green-200/40 blur-3xl" />
      </div>
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-md transition-all hover:text-teal-700 hover:shadow-lg"
      >
        ← Inicio
      </Link>
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:px-12">
        <div className="relative z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-8 text-white shadow-overlay md:p-12">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-green-400/15 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center space-y-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-100 ring-1 ring-inset ring-white/20">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Telemedicina veterinaria
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
                Unite a la familia
                <br />
                VetConnect.
              </h1>
              <p className="mt-6 max-w-lg text-body leading-relaxed text-teal-100/90">
                Creá tu cuenta y accedé a consultas veterinarias en línea e historial clínico digital para el cuidado de tu mascota.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: "10,000+", label: "Mascotas felices" },
                { num: "500+", label: "Veterinarios" },
                { num: "24/7", label: "Disponibilidad" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/15 bg-white/10 px-3 py-4 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold text-white">{stat.num}</p>
                  <p className="mt-1 text-xs text-teal-100/90">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-overlay md:p-10">
            <div className="mb-8">
              <div className="mb-2">
                <Link to="/" >
                <Logo size="sm" />
              </Link>
              </div>
              <h2 className="text-2xl font-bold text-ink">Crear cuenta</h2>
              <p className="mt-1 text-sm text-slate-500">
                Elegí el tipo de cuenta
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-danger-bg p-4 text-sm font-semibold text-danger">
                {error}
              </div>
            )}

            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`rounded-2xl border-2 p-5 text-center transition-all duration-normal ${
                  role === "owner"
                    ? "border-teal-700 bg-gradient-to-br from-teal-700 to-green-600 text-white shadow-lg shadow-teal-600/25"
                    : "border-border bg-white hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:scale-[0.97]"
                }`}
              >
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${role === "owner" ? "bg-white/15" : "bg-success-bg"}`}>
                  <Heart className={`h-6 w-6 ${role === "owner" ? "text-white" : "text-success"}`} />
                </div>
                <p className={`text-sm font-bold ${role === "owner" ? "text-white" : "text-ink"}`}>Dueño de mascota</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("vet")}
                className={`rounded-2xl border-2 p-5 text-center transition-all duration-normal ${
                  role === "vet"
                    ? "border-teal-700 bg-gradient-to-br from-teal-700 to-green-600 text-white shadow-lg shadow-teal-600/25"
                    : "border-border bg-white hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:scale-[0.97]"
                }`}
              >
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${role === "vet" ? "bg-white/15" : "bg-teal-50"}`}>
                  <Syringe className={`h-6 w-6 ${role === "vet" ? "text-white" : "text-teal-700"}`} />
                </div>
                <p className={`text-sm font-bold ${role === "vet" ? "text-white" : "text-ink"}`}>Veterinario</p>
              </button>
            </div>

            {role === "vet" && (
              <div className="mb-6 -mt-2 rounded-lg bg-teal-50 p-3 text-xs leading-relaxed text-teal-800 border border-teal-200">
                <strong>Validación Profesional Requerida:</strong> Por normativa sanitaria (SENASA / Ley 25.326), tu cuenta iniciará en estado <em>Pendiente de Verificación</em> hasta que el equipo administrativo valide tu matrícula profesional antes de habilitar la atención telemática.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
              />
              {role === "vet" && (
                <>
                  <Input
                    label="Matrícula Profesional (MN / MP) *"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Ej: MN 12345 / MP 6789"
                  />
                  <Input
                    label="Especialidad (Opcional)"
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej: Clínica Médica, Dermatología, Felinos"
                  />
                  <div className="rounded-lg border border-dashed border-teal-300 bg-teal-50/50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-teal-800">Documentación de Respaldo (SENASA / Colegio Veterinario):</p>
                    <p className="mt-1 text-slate-500">
                      Podrás adjuntar copia de tu título y credencial profesional en tu panel de perfil tras el registro para acelerar la aprobación administrativa.
                    </p>
                  </div>
                </>
              )}
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                value={password}
                error={passwordError || undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                  if (confirmPassword) setConfirmError("");
                }}
                placeholder="Contraseña segura"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-slate-400 transition-colors hover:text-teal-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
              <div className="-mt-2 mb-1">
                <ul className="space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const met = req.test(password);
                    return (
                      <li
                        key={req.label}
                        className={`flex items-center gap-2 text-xs ${
                          met ? "text-success" : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            met ? "border-success bg-success-bg" : "border-slate-300"
                          }`}
                        >
                          {met ? (
                            <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Input
                label="Repetir contraseña"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                error={confirmError || undefined}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError("");
                }}
                placeholder="Repetí tu contraseña"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="text-slate-400 transition-colors hover:text-teal-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
              <Button type="submit" loading={loading} variant="primary" size="lg" icon={<UserPlus className="h-5 w-5" />}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="font-bold text-teal-700 hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
