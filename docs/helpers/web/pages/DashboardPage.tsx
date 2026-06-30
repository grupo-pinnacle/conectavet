import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useContext(AuthContext)!;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {user.role === "VET" && "Panel del Médico"}
              {user.role === "CLIENT" && "Mis Mascotas"}
              {user.role === "ADMIN" && "Panel de Administración"}
            </h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {user.role === "CLIENT" && (
            <div>
              <p className="mb-4 text-gray-600">
                Bienvenido a VetConnect. Aquí podrás gestionar tus mascotas y solicitar consultas.
              </p>
              <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-400">
                Próximamente: lista de mascotas y botón de nueva consulta
              </div>
            </div>
          )}

          {user.role === "VET" && (
            <div>
              <p className="mb-4 text-gray-600">
                Panel del médico. Aquí verás tus consultas asignadas y podrás atender pacientes.
              </p>
              <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-400">
                Próximamente: lista de consultas y sala de videollamada
              </div>
            </div>
          )}

          {user.role === "ADMIN" && (
            <div>
              <p className="mb-4 text-gray-600">
                Panel de administración. Gestión de usuarios, consultas y configuración del sistema.
              </p>
              <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-400">
                Próximamente: tablas de administración
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
