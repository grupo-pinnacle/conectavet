import Input from "../components/input";
import Button from "../components/Button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form className="w-96 rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-center text-2xl font-bold">
          ¡Bienvenido a VetConnect!
        </h1>
        <div className="mb-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
          />
        </div>

        <div className="mb-4">
          <Input
            type="password"
            placeholder="Contraseña"
          />
        </div>

        <Button text="Iniciar Sesión" />
      </form>
    </div>
  );
}