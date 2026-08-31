"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as React from "react";

const petSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  species: z.string().min(1, "Especie requerida"),
  breed: z.string().optional(),
  age: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z.string().optional(),
  color: z.string().optional(),
  microchip: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

type PetForm = z.infer<typeof petSchema>;

interface AddPetDialogProps {
  className?: string;
}

export function AddPetDialog({ className = "" }: AddPetDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
    defaultValues: { name: "", species: "", breed: "", allergies: "", chronicConditions: "" },
  });

  const createMutation = trpc.pets.create.useMutation({
    onSuccess: () => { reset(); setOpen(false); },
  });

  const onSubmit = (data: PetForm) => {
    const payload = {
      ...data,
      age: data.age ?? undefined,
      weight: data.weight ?? undefined,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      allergies: data.allergies?.split(",").map(s => s.trim()).filter(Boolean) ?? [],
      chronicConditions: data.chronicConditions?.split(",").map(s => s.trim()).filter(Boolean) ?? [],
      photoUrl: data.photoUrl || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <>
      {className && !open && (
        <Button variant="outline" onClick={() => setOpen(true)} className={className}>
          + Agregar mascota
        </Button>
      )}
      {!className && (
        <Button variant="primary" onClick={() => setOpen(true)} size="lg">
          + Agregar mascota
        </Button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="add-pet-title">
          <div className="bg-white rounded-[var(--radius-lg)] border border-border shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="add-pet-title" className="text-lg font-semibold text-ink">Nueva mascota</h2>
              <button onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink" aria-label="Cerrar">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input label="Nombre *" error={errors.name?.message} {...register("name")} />
              <Input label="Especie *" error={errors.species?.message} {...register("species")} placeholder="Perro, Gato, etc." />
              <Input label="Raza" error={errors.breed?.message} {...register("breed")} placeholder="Opcional" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Edad" type="number" min={0} error={errors.age?.message} {...register("age", { valueAsNumber: true })} placeholder="Años" />
                <Input label="Peso (kg)" type="number" step={0.1} min={0} error={errors.weight?.message} {...register("weight", { valueAsNumber: true })} />
              </div>
              <Select label="Sexo" error={errors.sex?.message} {...register("sex")}>
                <option value="">No especificar</option>
                <option value="MALE">Macho</option>
                <option value="FEMALE">Hembra</option>
              </Select>
              <Input label="Fecha de nacimiento" type="date" error={errors.birthDate?.message} {...register("birthDate")} />
              <Input label="Color" error={errors.color?.message} {...register("color")} />
              <Input label="Microchip" error={errors.microchip?.message} {...register("microchip")} />
              <Input label="Alergias (separadas por coma)" error={errors.allergies?.message} {...register("allergies")} placeholder="Ej: polen, cierto antibiótico" />
              <Textarea label="Condiciones crónicas (separadas por coma)" error={errors.chronicConditions?.message} {...register("chronicConditions")} placeholder="Ej: diabetes, epilepsia" />
              <Input label="Foto (URL)" type="url" error={errors.photoUrl?.message} {...register("photoUrl")} placeholder="https://..." />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancelar</Button>
                <Button type="submit" className="flex-1" loading={createMutation.isPending}>Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}