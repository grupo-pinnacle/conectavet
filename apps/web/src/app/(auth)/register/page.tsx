"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/trpc/react";
import { Button, Input, Card, CardHeader, Select } from "@/components/ui";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
  role: z.enum(["CLIENT", "VET"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: "CLIENT" },
  });

  const role = watch("role");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => router.push("/login?registered=true"),
    onError: (e) => setError(e.message || "Error al registrar"),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(payload, {
      onSuccess: () => { setLoading(false); router.push("/login?registered=true"); },
      onError: () => setLoading(false),
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md" padding="lg">
        <CardHeader title="Crear cuenta" subtitle="Unite a ConectaVet" />
        {error && <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-[var(--radius-md)]" role="alert">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Select label="Tipo de cuenta" error={errors.role?.message} {...register("role")}>
            <option value="CLIENT">Dueño de mascota</option>
            <option value="VET">Veterinario</option>
          </Select>
          <Input label="Nombre" error={errors.firstName?.message} {...register("firstName")} placeholder="Opcional" />
          <Input label="Apellido" error={errors.lastName?.message} {...register("lastName")} placeholder="Opcional" />
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Contraseña" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <Input label="Confirmar contraseña" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Crear cuenta
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Ya tenés cuenta? <Link href="/login" className="text-brand font-medium hover:underline">Iniciá sesión</Link>
        </p>
      </Card>
    </div>
  );
}