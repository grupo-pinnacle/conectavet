"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader } from "@/components/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _x: any = null;

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
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
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Card className="w-full max-w-md" padding="lg">
        <CardHeader title="Iniciar sesión" subtitle="Accedé a tu cuenta de ConectaVet" />
        {error && <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-[var(--radius-md)]" role="alert">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Contraseña" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-border text-brand focus:ring-brand" />
              Recordarme
            </label>
            <Link href="/forgot-password" className="text-sm text-brand hover:underline">¿Olvidaste la contraseña?</Link>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Iniciar sesión
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿No tenés cuenta? <Link href="/register" className="text-brand font-medium hover:underline">Registrate</Link>
        </p>
      </Card>
    </div>
  );
}