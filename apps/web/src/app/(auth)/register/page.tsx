"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/trpc/react";
import { Button, Input, Card } from "@/components/ui";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluí al menos una mayúscula")
    .regex(/[0-9]/, "Incluí al menos un número"),
  confirmPassword: z.string(),
  role: z.enum(["CLIENT", "VET"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine((v) => v === true, { message: "Tenés que aceptar los términos" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "pending">("form");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: "CLIENT", acceptTerms: false },
  });

  const password = watch("password") || "";
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.user.role === "VET" && data.user.vetStatus === "PENDING") {
        setStep("pending");
      } else {
        router.push("/login?registered=true");
      }
    },
    onError: (e) => { setLoading(false); setError(e.message || "Error al registrar"); },
  });

  const onSubmit = (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    const { confirmPassword: _, acceptTerms: __, ...payload } = data;
    registerMutation.mutate(payload);
  };

  if (step === "pending") {
    return (
      <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-6">
        <Card padding="lg" className="max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-ink mb-2">¡Registro recibido!</h2>
          <p className="text-ink-soft mb-4">
            Los veterinarios deben pasar por un proceso de aprobación. Te avisaremos por email cuando tu cuenta esté activa (24-48 h hábiles).
          </p>
          <Link href="/login"><Button>Iniciar sesión</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-128px)] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-ink mb-2">Crear cuenta</h1>
          <p className="text-ink-soft mb-6">Unite a VetConnect</p>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-1.5">Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer ${watch("role") === "CLIENT" ? "border-brand bg-brand-soft" : "border-border"}`}>
                  <input type="radio" value="CLIENT" {...register("role")} className="text-brand focus:ring-brand" />
                  <div>
                    <p className="font-medium text-ink text-sm">Dueño de mascota</p>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer ${watch("role") === "VET" ? "border-brand bg-brand-soft" : "border-border"}`}>
                  <input type="radio" value="VET" {...register("role")} className="text-brand focus:ring-brand" />
                  <div>
                    <p className="font-medium text-ink text-sm">Veterinario</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Nombre" placeholder="Juan" error={errors.firstName?.message} {...register("firstName")} />
              <Input label="Apellido" placeholder="Pérez" error={errors.lastName?.message} {...register("lastName")} />
            </div>

            <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register("email")} />

            <div>
              <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />
              <ul className="mt-1 space-y-0.5 text-xs">
                <li className={checks.length ? "text-green-600" : "text-ink-soft"}>
                  {checks.length ? "✓" : "○"} Mínimo 8 caracteres
                </li>
                <li className={checks.upper ? "text-green-600" : "text-ink-soft"}>
                  {checks.upper ? "✓" : "○"} Incluye mayúscula
                </li>
                <li className={checks.number ? "text-green-600" : "text-ink-soft"}>
                  {checks.number ? "✓" : "○"} Incluye número
                </li>
              </ul>
            </div>

            <Input label="Confirmar contraseña" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

            <Input label="Teléfono (opcional)" type="tel" placeholder="+54 11 ..." {...register("phone")} />

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded border-border text-brand focus:ring-brand" {...register("acceptTerms")} />
              <span className="text-ink-soft">
                Acepto los{" "}
                <Link href="/terms" className="text-brand hover:underline">Términos y Condiciones</Link>
                {" "}y la{" "}
                <Link href="/privacy" className="text-brand hover:underline">Política de Privacidad</Link>.
              </span>
            </label>
            {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Crear cuenta
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink-soft">o regístrate con</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">Google</Button>
            <Button variant="outline" type="button">Apple</Button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-brand font-medium hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-brand-soft to-white p-12 relative overflow-hidden">
        <div className="max-w-md relative z-10">
          <h2 className="text-3xl font-bold text-ink mb-6">Todo lo que tu mascota necesita</h2>
          <ul className="space-y-4">
            {[
              { icon: "🩺", title: "Consultas en línea", desc: "Conectá con veterinarios al instante" },
              { icon: "👨‍⚕️", title: "Vets verificados", desc: "Profesionales matriculados y evaluados" },
              { icon: "📅", title: "Agenda 24/7", desc: "Solicitá cuando te quede cómodo" },
              { icon: "📋", title: "Historial seguro", desc: "Recetas y registros siempre a mano" },
              { icon: "🔔", title: "Recordatorios", desc: "Vacunas y controles nunca se olvidan" },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-brand text-white flex items-center justify-center text-lg flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-ink">{f.title}</p>
                  <p className="text-sm text-ink-soft">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 p-4 bg-white rounded-md border border-border">
            <p className="text-xs text-ink-soft">
              🔒 Tu información está protegida según la Ley 25.326 de Protección de Datos Personales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}