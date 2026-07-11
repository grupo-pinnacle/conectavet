import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "vet" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!role) { setError("Seleccioná si sos dueño de mascota o veterinario"); return; }
    if (!name.trim()) { setError("Ingresá tu nombre completo"); return; }
    if (!email.trim()) { setError("Ingresá tu correo electrónico"); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:px-12">
        {/* Brand side */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#2563EB]">
              TELEMEDICINA VETERINARIA
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-[#0F172A] lg:text-5xl">
              Unite a la familia
              <br />
              VetConnect.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#475569]">
              Creá tu cuenta y accedé a consultas veterinarias en línea,
              historial clínico digital y asistencia IA para el cuidado de tu
              mascota.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { num: "10,000+", label: "Mascotas felices" },
              { num: "500+", label: "Veterinarios" },
              { num: "24/7", label: "Disponibilidad" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-3 shadow-sm">
                <p className="text-lg font-bold text-[#2563EB]">{stat.num}</p>
                <p className="text-xs text-[#475569]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Register form */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-8 shadow-lg md:p-12">
            <div className="mb-8">
              <div className="mb-2">
                <Logo size="sm" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Crear cuenta</h2>
              <p className="mt-1 text-sm text-[#475569]">
                Elegí el tipo de cuenta
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Role selection */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`rounded-xl border-2 p-5 text-center transition-all ${
                  role === "owner"
                    ? "border-[#2563EB] bg-blue-50"
                    : "border-[#CBD5E1] bg-white hover:border-gray-300"
                }`}
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <svg className="h-6 w-6 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">Dueño de mascota</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("vet")}
                className={`rounded-xl border-2 p-5 text-center transition-all ${
                  role === "vet"
                    ? "border-[#2563EB] bg-blue-50"
                    : "border-[#CBD5E1] bg-white hover:border-gray-300"
                }`}
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-6 w-6 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#0F172A]">Veterinario</p>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#475569]">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#2563EB] py-3.5 text-base font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#475569]">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
