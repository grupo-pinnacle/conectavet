import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

const ROLES = [
  { value: "CLIENT", label: "Dueño de mascota" },
  { value: "VET", label: "Veterinario" },
  { value: "ADMIN", label: "Administrador" },
];

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser(email, password, role);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-96 rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">
          Crear cuenta en VetConnect
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-100 p-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña (mín. 6 caracteres)
          </label>
          <Input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de usuario
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded border p-2"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <Button text={isLoading ? "Creando cuenta..." : "Crear cuenta"} disabled={isLoading} />

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="text-[#5460c4] hover:underline">
            Iniciar sesión
          </a>
        </p>
      </form>
    </div>
  );
}
