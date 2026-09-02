import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Input from "../components/input";
import api from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresá tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
      setError(msg || "Error al solicitar el restablecimiento. Intentá más tarde.");
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
            <h1 className="text-2xl font-bold text-ink">Recuperar contraseña</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-ink">Revisá tu correo</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Si el correo <strong className="text-ink">{email}</strong> está registrado, recibirás las instrucciones en unos momentos.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="secondary" size="md" className="w-full">
                    Volver a Iniciar Sesión
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
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  leftIcon={<Mail className="h-5 w-5 text-slate-400" />}
                />

                <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full">
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
