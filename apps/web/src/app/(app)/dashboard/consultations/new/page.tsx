"use client";


import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Button, Card, CardHeader, Select, Textarea, Input } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createSchema = z.object({
  petId: z.string().cuid(),
  reason: z.string().min(10, "Describí el motivo (mín. 10 caracteres)"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPetId = searchParams.get("petId");

  const { data: pets } = trpc.pets.list.useQuery();
  const { data: vets } = trpc.users.listVets.useQuery();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { petId: preselectedPetId || "", reason: "" },
  });

  const createMutation = trpc.consultations.create.useMutation({
    onSuccess: (res) => router.push(`/dashboard/consultations/${res.id}`),
  });

  const onSubmit = (data: CreateForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Nueva consulta</h1>
        <p className="text-ink-soft">Solicitá una videollamada con un veterinario</p>
      </div>

      {pets?.length === 0 && (
        <Card className="bg-amber-50 border-amber-200" padding="md">
          <p className="text-amber-800">No tenés mascotas registradas. <a href="/dashboard" className="font-medium underline">Agregá una primero</a>.</p>
        </Card>
      )}

      <Card padding="lg">
        <CardHeader title="Datos de la consulta" />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Select label="Mascota *" error={errors.petId?.message} {...register("petId")}>
            <option value="">Seleccioná una mascota</option>
            {pets?.map((p: { id: string; name: string; species: string }) => (
              <option key={p.id} value={p.id} selected={p.id === preselectedPetId}>
                {p.name} ({p.species})
              </option>
            ))}
          </Select>

          <Textarea
            label="Motivo de la consulta *"
            placeholder="Describí los síntomas, antecedentes, y qué necesitás..."
            rows={5}
            error={errors.reason?.message}
            {...register("reason")}
          />

          {vets && vets.length > 0 && (
            <div className="p-3 bg-surface rounded-[var(--radius-md)]">
              <p className="text-sm text-ink-soft mb-2">Veterinarios online disponibles:</p>
              <div className="flex flex-wrap gap-2">
                {vets.map((v: { id: string; firstName: string | null; lastName: string | null; specialty?: string | null }) => (
                  <span key={v.id} className="px-2 py-1 text-xs bg-white border border-border rounded-full">
                    {v.firstName} {v.lastName} {v.specialty && `· ${v.specialty}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" className="flex-1" size="lg" loading={createMutation.isPending}>
              Solicitar consulta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}