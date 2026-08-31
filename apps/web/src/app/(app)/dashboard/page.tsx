"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Button, Card, CardHeader, Input } from "@/components/ui";
import { PetCard } from "./PetCard";
import { AddPetDialog } from "./AddPetDialog";

export default function ClientDashboard() {
  const { data: session } = useSession();
  const { data: pets } = trpc.pets.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis mascotas</h1>
          <p className="text-ink-soft">Gestioná la información de tus compañeros</p>
        </div>
        <AddPetDialog />
      </div>

      {pets?.length === 0 ? (
        <Card className="text-center py-12" padding="lg">
          <svg className="mx-auto h-12 w-12 text-ink-soft/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-ink">No tenés mascotas registradas</h3>
          <p className="mt-1 text-ink-soft">Agregá la primera para poder solicitar consultas</p>
          <AddPetDialog className="mt-4" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets?.map((pet: { id: string; name: string; species: string }) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}