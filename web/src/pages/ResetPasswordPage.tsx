import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/input";
import api from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de restablecimiento no proporcionado o inválido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
      setError(msg || "Error al restablecer la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-white p-8 shadow-overlay md:p-10">
          <div className="mb-6 text-center">
            <div className="inline-block mb-3">
              <Logo size="sm" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Nueva contraseña</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresá tu nueva contraseña para acceder a tu cuenta.
            </p>
          </div>

          {!token && (
            <div className="mb-5 rounded-lg bg-danger-bg p-4 text-sm font-semibold text-danger">
              Enlace de restablecimiento inválido. Por favor solicitá uno nuevo.
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-ink">¡Contraseña actualizada!</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu contraseña fue cambiada con éxito. Serás redirigido al inicio de sesión en unos segundos...
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Iniciar Sesión Ahora
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-lg bg-danger-bg p-4 text-sm font-semibold text-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Nueva Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  leftIcon={<Lock className="h-5 w-5 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="text-slate-400 hover:text-teal-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <Input
                  label="Confirmar Nueva Contraseña"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí tu nueva contraseña"
                  leftIcon={<Lock className="h-5 w-5 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="text-slate-400 hover:text-teal-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                <Button
                  type="submit"
                  loading={loading}
                  disabled={!token}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {loading ? "Guardando..." : "Restablecer Contraseña"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
