"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/trpc/react";
import { Button, Input, Card } from "@/components/ui";

const forgotSchema = z.object({ email: z.string().email("Email inválido") });
type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const mutation = trpc.auth.forgotPassword.useMutation({ onSuccess: () => setSent(true) });

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-6">
        <Card padding="lg" className="max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-ink mb-2">Email enviado</h2>
          <p className="text-ink-soft mb-4">Si la dirección existe, te enviamos un link para restablecer tu contraseña.</p>
          <Link href="/login"><Button>Volver a iniciar sesión</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-6">
      <Card padding="lg" className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-ink mb-2">Recuperar contraseña</h1>
        <p className="text-ink-soft mb-6 text-sm">Te enviaremos un email con instrucciones.</p>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Button type="submit" className="w-full" loading={mutation.isPending}>Enviar link</Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/login" className="text-brand hover:underline">Volver a iniciar sesión</Link>
        </p>
      </Card>
    </div>
  );
}