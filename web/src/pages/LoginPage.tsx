import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart, LogIn } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/input";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Ingresá tu correo electrónico"); return; }
    if (!password) { setError("Ingresá tu contraseña"); return; }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
      setError(msg || "Error al iniciar sesión. Verificá tus datos.");
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
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-teal-50/70 blur-3xl" />
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
                Cuidado experto
                <br />
                para tu mascota.
              </h1>
              <p className="mt-6 max-w-lg text-body leading-relaxed text-teal-100/90">
                Conectá con los mejores veterinarios desde la comodidad de tu
                hogar. Cuidado experto para tu mascota, a solo un clic de
                distancia.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/15">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Veterinarios certificados 24/7</p>
                <p className="text-sm text-teal-100/90">Matriculados y siempre disponibles</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-overlay md:p-10">
            <div className="mb-8">
              <div className="mb-2">
                <Link to="/">
                  <Logo size="sm" />
                </Link>
              </div>
              <h2 className="text-2xl font-bold text-ink">Iniciar Sesión</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bienvenido de nuevo a VetConnect.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-danger-bg p-4 text-sm font-semibold text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contraseña
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
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
              </div>
              <Button type="submit" loading={loading} variant="primary" size="lg" icon={<LogIn className="h-5 w-5" />}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              ¿No tenés una cuenta?{" "}
              <Link to="/register" className="font-bold text-teal-700 hover:underline">
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
