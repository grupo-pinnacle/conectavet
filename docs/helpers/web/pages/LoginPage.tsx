import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

export default function LoginPage() {
  const { login, isLoading } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-96 rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">
          ¡Bienvenido a VetConnect!
        </h1>

        {error && (
          <p className="mb-4 rounded bg-red-100 p-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mb-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button text={isLoading ? "Iniciando sesión..." : "Iniciar Sesión"} disabled={isLoading} />

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿No tenés cuenta?{" "}
          <a href="/register" className="text-[#5460c4] hover:underline">
            Registrate
          </a>
        </p>
      </form>
    </div>
  );
}
