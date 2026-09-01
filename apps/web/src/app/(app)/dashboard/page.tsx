"use client";


import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Avatar, Button, Badge } from "@/components/ui";
import { PetCard } from "./PetCard";
import { AddPetDialog } from "./AddPetDialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusVariant: Record<string, "warning" | "info" | "success" | "neutral" | "danger"> = {
  WAITING: "warning",
  PENDING: "info",
  ACTIVE: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

const statusLabel: Record<string, string> = {
  WAITING: "Esperando vet",
  PENDING: "Pendiente",
  ACTIVE: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default function ClientHome() {
  const { data: session } = useSession();
  const { data: pets } = trpc.pets.list.useQuery();
  const { data: consultations } = trpc.consultations.mine.useQuery();

  const active = (consultations ?? []).filter((c: { status: string }) => c.status === "ACTIVE").length;
  const waiting = (consultations ?? []).filter((c: { status: string }) => c.status === "WAITING").length;
  const completed = (consultations ?? []).filter((c: { status: string }) => c.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Hola, {session?.user?.name?.split(" ")[0] || "bienvenido"} 👋</h1>
          <p className="text-ink-soft">¿Cómo podemos ayudar hoy?</p>
        </div>
        <AddPetDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mis mascotas" value={pets?.length ?? 0} icon="🐾" variant="brand" />
        <StatCard label="En curso" value={active} icon="🩺" variant="success" />
        <StatCard label="Esperando" value={waiting} icon="⏱" variant="warning" />
        <StatCard label="Completadas" value={completed} icon="✓" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Mis mascotas</h3>
            <Link href="/dashboard/pets" className="text-sm text-brand hover:underline">Ver todas</Link>
          </div>
          {pets?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-3">🐾</p>
              <p className="text-ink-soft mb-4">Aún no tenés mascotas registradas.</p>
              <AddPetDialog className="inline-block" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pets?.slice(0, 4).map((pet: { id: string; name: string; species: string; photoUrl?: string | null }) => (
                <Link key={pet.id} href={`/dashboard/consultations/new?petId=${pet.id}`} className="flex items-center gap-3 p-3 bg-surface rounded-[var(--radius-md)] hover:bg-brand-soft">
                  <Avatar src={pet.photoUrl} name={pet.name ?? undefined} alt={pet.name ?? "Mascota"} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink">{pet.name}</p>
                    <p className="text-xs text-ink-soft">{pet.species}</p>
                  </div>
                  <span className="text-brand text-sm">+ Consulta</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ink mb-4">Consultas recientes</h3>
          {(consultations ?? []).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-ink-soft text-sm mb-3">Sin consultas aún</p>
              <Link href="/dashboard/consultations/new">
                <Button size="sm">Iniciar consulta</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(consultations ?? []).slice(0, 5).map((c: { id: string; status: string; pet?: { name: string; photoUrl?: string | null } | null; createdAt: Date | string }) => (
                <Link key={c.id} href={`/dashboard/consultations/${c.id}`} className="block p-3 rounded-md hover:bg-surface">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={c.pet?.photoUrl} name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="sm" />
                    <p className="font-medium text-ink text-sm flex-1">{c.pet?.name}</p>
                    <Badge variant={statusVariant[c.status]} size="sm">{statusLabel[c.status] || c.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-soft ml-9">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}