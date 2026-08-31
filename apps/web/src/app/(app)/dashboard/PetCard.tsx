"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button, Card } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    age?: number | null;
    weight?: number | null;
    photoUrl?: string | null;
    sex?: "MALE" | "FEMALE" | null;
    color?: string | null;
  };
}

export function PetCard({ pet }: PetCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = trpc.pets.remove.useMutation();

  const handleDelete = () => {
    deleteMutation.mutate({ id: pet.id });
  };

  return (
    <Card hover padding="md" className="flex flex-col">
      <div className="aspect-square w-full rounded-[var(--radius-md)] overflow-hidden bg-surface relative mb-3">
        {pet.photoUrl ? (
          <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-soft/30 text-4xl">🐾</div>
        )}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="secondary" size="sm" onClick={handleDelete} loading={deleteMutation.isPending}>Eliminar</Button>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className="font-semibold text-ink">{pet.name}</h3>
        <p className="text-sm text-ink-soft">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 text-xs text-ink-soft">
          {pet.age !== null && pet.age !== undefined && <span>🎂 {pet.age} años</span>}
          {pet.weight && <span>⚖️ {pet.weight} kg</span>}
          {pet.sex && <span>{pet.sex === "MALE" ? "♂" : "♀"}</span>}
          {pet.color && <span>🎨 {pet.color}</span>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmDelete(true)}>Eliminar</Button>
                <Button variant="primary" size="sm" className="flex-1">
                  <a href={`/dashboard/consultations/new?petId=${pet.id}`} className="w-full h-full flex items-center justify-center">Consultar</a>
                </Button>
              </div>
    </Card>
  );
}