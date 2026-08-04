import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Syringe } from "lucide-react";
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
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const pwdError = validatePassword(password);
    if (pwdError) { setPasswordError(pwdError); setError(pwdError); return; }
    if (password !== confirmPassword) { setConfirmError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await register(name, email, password, role);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error al crear la cuenta. Intentá de nuevo.";
      console.error("Register error:", err);
      setError(msg);
      setLoading(false);
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface font-sans">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-12">
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
              TELEMEDICINA VETERINARIA
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-ink lg:text-5xl tracking-tight">
              Unite a la familia
              <br />
              VetConnect.
            </h1>
            <p className="mt-4 max-w-lg text-body leading-relaxed text-slate-500">
              Creá tu cuenta y accedé a consultas veterinarias en línea e historial clínico digital para el cuidado de tu mascota.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { num: "10,000+", label: "Mascotas felices" },
              { num: "500+", label: "Veterinarios" },
              { num: "24/7", label: "Disponibilidad" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-white px-5 py-3 shadow-subtle">
                <p className="text-lg font-bold text-teal-700">{stat.num}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-border bg-white p-8 shadow-overlay md:p-12">
            <div className="mb-8">
              <div className="mb-2">
                <Logo size="sm" />
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
                className={`rounded-xl border-2 p-5 text-center transition-all ${
                  role === "owner"
                    ? "border-teal-700 bg-teal-50"
                    : "border-border bg-white hover:border-slate-300"
                }`}
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
                  <Heart className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm font-bold text-ink">Dueño de mascota</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("vet")}
                className={`rounded-xl border-2 p-5 text-center transition-all ${
                  role === "vet"
                    ? "border-teal-700 bg-teal-50"
                    : "border-border bg-white hover:border-slate-300"
                }`}
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
                  <Syringe className="h-6 w-6 text-teal-700" />
                </div>
                <p className="text-sm font-bold text-ink">Veterinario</p>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Nombre completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
              />
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                error={passwordError || undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                  if (confirmPassword) setConfirmError("");
                }}
                placeholder="Contraseña segura"
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
                type="password"
                value={confirmPassword}
                error={confirmError || undefined}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmError("");
                }}
                placeholder="Repetí tu contraseña"
              />
              <Button type="submit" loading={loading} variant="primary" size="lg">
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
