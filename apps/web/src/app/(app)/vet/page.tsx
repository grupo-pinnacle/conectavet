"use client";


import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Card, Badge, StatCard, Avatar, Button } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

const statusVariant: Record<string, "warning" | "info" | "success" | "neutral" | "danger"> = {
  WAITING: "warning",
  PENDING: "info",
  ACTIVE: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

const statusLabel: Record<string, string> = {
  WAITING: "Esperando",
  PENDING: "Pendiente",
  ACTIVE: "En consulta",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default function VetHomePage() {
  const { data: session } = useSession();
  const isVet = session?.user?.role === "VET";
  const isApproved = session?.user?.vetStatus === "APPROVED";
  const firstName = session?.user?.name?.split(" ")[0] || "Doctor";

  const { data: queue } = trpc.consultations.queue.useQuery(undefined, { refetchInterval: 10_000 });
  const { data: active } = trpc.consultations.active.useQuery(undefined, { refetchInterval: 5_000 });
  const { data: history } = trpc.consultations.mine.useQuery(undefined);

  if (!isVet || !isApproved) {
    return (
      <Card padding="lg" className="text-center max-w-md mx-auto">
        <div className="text-4xl mb-3">⏳</div>
        <h2 className="text-xl font-semibold text-ink mb-2">Acceso veterinario</h2>
        <p className="text-ink-soft">
          {!isVet
            ? "Esta sección es solo para veterinarios registrados."
            : "Tu registro está pendiente de aprobación por un administrador."}
        </p>
      </Card>
    );
  }

  const todayConsultations = (history ?? []).filter((c: { createdAt: Date | string }) => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;
  const completedCount = (history ?? []).filter((c: { status: string }) => c.status === "COMPLETED").length;
  const patientsCount = new Set((history ?? []).map((c: { petId: string }) => c.petId)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">¡Bienvenido, Dr. {firstName}! 👋</h1>
        <p className="text-ink-soft">Acá tenés el resumen de hoy.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consultas hoy" value={todayConsultations} icon="🩺" variant="brand" />
        <StatCard label="Pacientes totales" value={patientsCount} icon="🐾" />
        <StatCard label="Completadas" value={completedCount} icon="✓" variant="success" />
        <StatCard label="En cola" value={queue?.length ?? 0} icon="⏱" variant="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Cola de espera</h3>
            <Link href="/vet/consultas" className="text-sm text-brand hover:underline">Ver todas</Link>
          </div>
          {queue && queue.length > 0 ? (
            <div className="space-y-3">
              {queue.slice(0, 5).map((c: { id: string; reason?: string | null; pet?: { name: string; species: string; photoUrl?: string | null } | null; client?: { firstName?: string | null; lastName?: string | null } | null; createdAt: Date | string }) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-surface rounded-[var(--radius-md)]">
                  <Avatar src={c.pet?.photoUrl} name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{c.pet?.name} · {c.pet?.species}</p>
                    <p className="text-sm text-ink-soft truncate">
                      {c.client ? `${c.client.firstName} ${c.client.lastName}` : "Cliente"} · {c.reason || "Sin motivo especificado"}
                    </p>
                    <p className="text-xs text-ink-soft/70">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}</p>
                  </div>
                  <Link href={`/dashboard/consultations/${c.id}`}>
                    <Button size="sm">Tomar</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-soft text-center py-6">No hay consultas en espera</p>
          )}
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ink mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            <Link href="/vet/consultas" className="block p-3 rounded-md hover:bg-surface">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <p className="font-medium text-ink text-sm">Iniciar consulta</p>
                  <p className="text-xs text-ink-soft">Atender paciente en cola</p>
                </div>
              </div>
            </Link>
            <Link href="/vet/recetas" className="block p-3 rounded-md hover:bg-surface">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💊</span>
                <div>
                  <p className="font-medium text-ink text-sm">Nueva receta</p>
                  <p className="text-xs text-ink-soft">Generar prescripción</p>
                </div>
              </div>
            </Link>
            <Link href="/vet/pacientes" className="block p-3 rounded-md hover:bg-surface">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐾</span>
                <div>
                  <p className="font-medium text-ink text-sm">Agregar paciente</p>
                  <p className="text-xs text-ink-soft">Nuevo paciente</p>
                </div>
              </div>
            </Link>
            <Link href="/vet/historial" className="block p-3 rounded-md hover:bg-surface">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium text-ink text-sm">Historial clínico</p>
                  <p className="text-xs text-ink-soft">Ver registros</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink">En curso</h3>
          <Badge variant="success">{active?.length ?? 0}</Badge>
        </div>
        {active && active.length > 0 ? (
          <div className="space-y-3">
            {active.map((c: { id: string; pet?: { name: string; species: string; photoUrl?: string | null } | null; client?: { firstName?: string | null; lastName?: string | null } | null; startedAt?: Date | string | null }) => (
              <Link key={c.id} href={`/dashboard/consultations/${c.id}`} className="block">
                <div key={c.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-[var(--radius-md)] hover:bg-green-100">
                  <Avatar name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="md" src={c.pet?.photoUrl} />
                  <div className="flex-1">
                    <p className="font-medium text-ink">{c.pet?.name} · {c.pet?.species}</p>
                    <p className="text-sm text-ink-soft">{c.client?.firstName} {c.client?.lastName}</p>
                  </div>
                  <Badge variant="success">{statusLabel.ACTIVE}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-ink-soft text-center py-6">Sin consultas activas</p>
        )}
      </Card>
    </div>
  );
}