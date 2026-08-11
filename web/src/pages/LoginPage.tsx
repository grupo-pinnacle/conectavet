import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Heart } from "lucide-react";
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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al iniciar sesión. Verificá tus datos.");
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
              Cuidado experto
              <br />
              para tu mascota.
            </h1>
            <p className="mt-4 max-w-lg text-body leading-relaxed text-slate-500">
              Conectá con los mejores veterinarios desde la comodidad de tu
              hogar. Cuidado experto para tu mascota, a solo un clic de
              distancia.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-green-50 p-8 lg:justify-start">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-success-bg lg:mx-0">
                <Heart className="h-12 w-12 text-success" />
              </div>
              <p className="text-lg font-bold text-ink lg:text-left">
                Veterinarios certificados 24/7
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-border bg-white p-8 shadow-overlay md:p-12">
            <div className="mb-8">
              <div className="mb-2">
                <Logo size="sm" />
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
                  <a href="#" className="text-xs font-semibold text-teal-700 hover:underline">
                    ¿olvidaste tu contraseña?
                  </a>
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
              <Button type="submit" loading={loading} variant="primary" size="lg">
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold uppercase text-slate-500">
                  o continúa con
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor" />
                </svg>
                Apple
              </button>
            </div>

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
