"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-[calc(100vh-128px)] grid lg:grid-cols-2">
      {/* Formulario (izquierda) */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-ink mb-2">Iniciar sesión</h1>
          <p className="text-ink-soft mb-6">Accedé a tu cuenta de VetConnect</p>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-border text-brand focus:ring-brand" />
                Recordarme
              </label>
              <Link href="/forgot-password" className="text-sm text-brand hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Iniciar sesión
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-soft">o continúa con</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">Google</Button>
            <Button variant="outline" type="button">Apple</Button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-brand font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>

      {/* Hero (derecha) */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-soft to-white p-12 relative overflow-hidden">
        <div className="max-w-md text-center relative z-10">
          <h2 className="text-4xl font-bold text-ink mb-4 leading-tight">
            El mejor cuidado para tu <span className="text-brand">mascota</span>, donde estés.
          </h2>
          <p className="text-ink-soft mb-8">
            Videoconsultas con veterinarios matriculados, historial clínico digital y recetas al instante.
          </p>

          <div className="text-8xl mb-6">🐶🐱</div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl mb-1">📹</div>
              <p className="text-xs text-ink-soft">Video consultas</p>
            </div>
            <div>
              <div className="text-2xl mb-1">👨‍⚕️</div>
              <p className="text-xs text-ink-soft">Vets verificados</p>
            </div>
            <div>
              <div className="text-2xl mb-1">📋</div>
              <p className="text-xs text-ink-soft">Historial clínico</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-128px)] flex items-center justify-center"><div className="animate-pulse text-ink-soft">Cargando...</div></div>}>
      <LoginFormInner />
    </Suspense>
  );
}