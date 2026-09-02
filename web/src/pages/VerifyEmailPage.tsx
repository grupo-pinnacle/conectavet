import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import api from "../services/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Enlace de verificación incompleto o inválido.");
      return;
    }

    api
      .get(`/api/auth/verify-email?token=${token}`)
      .then(() => {
        setSuccess(true);
        setMessage("¡Tu correo electrónico ha sido verificado con éxito!");
      })
      .catch((err) => {
        setSuccess(false);
        const msg = err.response?.data?.message || "El token de verificación es inválido o ha expirado.";
        setMessage(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface font-sans flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-white p-8 shadow-overlay md:p-10 text-center">
          <div className="inline-block mb-6">
            <Logo size="sm" />
          </div>

          {loading ? (
            <div className="py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-teal-700 mx-auto" />
              <h2 className="text-lg font-bold text-ink">Verificando tu cuenta...</h2>
              <p className="text-sm text-slate-500">Por favor aguardá un momento.</p>
            </div>
          ) : success ? (
            <div className="py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-ink">¡Cuenta verificada!</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-ink">No pudimos verificar tu correo</h1>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="secondary" size="md" className="w-full">
                    Ir al Inicio de Sesión
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
