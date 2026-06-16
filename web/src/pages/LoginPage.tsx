export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="w-96 rounded-lg border p-6">
        <h1 className="mb-4 text-2xl font-bold">Iniciar Sesión</h1>

        <input
          type="email"
          placeholder="Email"
          className="mb-3 w-full border p-2"
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="mb-3 w-full border p-2"
        />

        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 text-white"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}