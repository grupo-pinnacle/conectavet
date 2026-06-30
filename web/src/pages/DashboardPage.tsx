import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold">VetConnect</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            {user.role === "VET" ? "Veterinario" : user.role === "ADMIN" ? "Admin" : "Cliente"}
          </span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        <h2 className="mb-4 text-2xl font-semibold">
          {user.role === "VET" ? "Panel del Veterinario" : "Mis Mascotas"}
        </h2>
        <p className="text-gray-600">
          {user.role === "VET"
            ? "Acá vas a ver las consultas asignadas."
            : "Acá vas a ver y gestionar tus mascotas."}
        </p>
      </main>
    </div>
  );
}
