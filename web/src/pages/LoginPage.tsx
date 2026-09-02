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
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
      setError(msg || "Error al iniciar sesión. Verificá tus datos.");
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
              <Button type="submit" loading={loading} variant="primary" size="lg">
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
