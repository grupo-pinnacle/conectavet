"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Button, Card, CardHeader } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default function VetDashboard() {
  const { data: session } = useSession();
  const { data: queue } = trpc.consultations.queue.useQuery(undefined, { refetchInterval: 10000 });
  const { data: active } = trpc.consultations.active.useQuery(undefined, { refetchInterval: 5000 });
  const { data: myConsultations } = trpc.consultations.mine.useQuery(undefined);
  const setAvailabilityMutation = trpc.users.setAvailability.useMutation();
  const assignMutation = trpc.consultations.assign.useMutation();

  const isVet = session?.user?.role === "VET";
  const isApproved = session?.user?.vetStatus === "APPROVED";

  if (!isVet) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card padding="lg" className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-ink">Acceso veterinario</h2>
          <p className="mt-2 text-ink-soft">Esta sección es solo para veterinarios registrados.</p>
        </Card>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card padding="lg" className="text-center max-w-md">
          <div className="text-amber-600 text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-ink">Cuenta pendiente de aprobación</h2>
          <p className="mt-2 text-ink-soft">Tu registro como veterinario está en revisión. Un administrador lo aprobará pronto.</p>
          <p className="mt-4 text-sm text-ink-soft">Estado: <span className="font-medium capitalize">{session?.user?.vetStatus?.toLowerCase()}</span></p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Panel veterinario</h1>
          <p className="text-ink-soft">Gestioná tu cola y consultas activas</p>
        </div>
        <Button variant="outline" onClick={() => setAvailabilityMutation.mutate({ isOnline: true })}>Disponible</Button>
      </div>

      {/* Cola de espera */}
      <Card padding="lg">
        <CardHeader title={`Cola de espera (${queue?.length || 0})`} subtitle="Consultas esperando veterinario" />
        {queue && queue.length > 0 ? (
          <div className="space-y-3">
            {queue.map((c: { id: string; createdAt: Date | string; pet?: { name: string; species: string; breed?: string | null; age?: number | null; photoUrl?: string | null } | null; reason?: string | null }) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-surface rounded-[var(--radius-md)] border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-white flex items-center justify-center">
                    {c.pet?.photoUrl ? (
                      <img src={c.pet.photoUrl} alt={c.pet.name} className="w-full h-full object-cover rounded-[var(--radius-md)]" />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-ink">{c.pet?.name}</h4>
                    <p className="text-sm text-ink-soft">{c.pet?.species}{c.pet?.breed ? ` · ${c.pet.breed}` : ""} · {c.pet?.age ? `${c.pet.age} años` : ""}</p>
                    <p className="text-xs text-ink-soft/70">{c.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">Esperando</span>
                  <span className="text-xs text-ink-soft/60">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}</span>
                  <Button size="sm" onClick={() => assignMutation.mutate({ id: c.id })}>
                    Tomar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-soft">
            <svg className="mx-auto h-10 w-10 mb-3 text-ink-soft/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No hay consultas en espera</p>
          </div>
        )}
      </Card>

      {/* Consultas activas */}
      <Card padding="lg">
        <CardHeader title={`En curso (${active?.length || 0})`} subtitle="Tus consultas activas" />
        {active && active.length > 0 ? (
          <div className="space-y-3">
            {active.map((c: { id: string; pet?: { name: string; species: string; photoUrl?: string | null } | null; client?: { firstName?: string | null; lastName?: string | null } | null }) => (
              <Link key={c.id} href={`/dashboard/consultations/${c.id}`} className="block">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-[var(--radius-md)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-white flex items-center justify-center">
                      {c.pet?.photoUrl ? (
                        <img src={c.pet.photoUrl} alt={c.pet.name} className="w-full h-full object-cover rounded-[var(--radius-md)]" />
                      ) : (
                        <span className="text-2xl">🐾</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-ink">{c.pet?.name}</h4>
                      <p className="text-sm text-ink-soft">{c.pet?.species} · {c.client?.firstName} {c.client?.lastName}</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Entrar</Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-soft">No tenés consultas activas</div>
        )}
      </Card>

      {/* Historial */}
      <Card padding="lg">
        <CardHeader title="Historial reciente" subtitle="Tus últimas consultas completadas" />
        {myConsultations && myConsultations.length > 0 ? (
          <div className="space-y-2">
            {myConsultations
              .filter((c: { status: string }) => c.status === "COMPLETED" || c.status === "CANCELLED")
              .slice(0, 10)
              .map((c: { id: string; updatedAt: Date | string; status: string; pet?: { name: string; species: string; photoUrl?: string | null } | null }) => (
                <div key={c.id} className="flex items-center justify-between p-3 hover:bg-surface rounded-[var(--radius-md)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-surface flex items-center justify-center">
                      {c.pet?.photoUrl ? (
                        <img src={c.pet.photoUrl} alt={c.pet.name} className="w-full h-full object-cover rounded-[var(--radius-md)]" />
                      ) : (
                        <span className="text-xl">🐾</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{c.pet?.name} · {c.pet?.species}</p>
                      <p className="text-sm text-ink-soft">{formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true, locale: es })}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${c.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {c.status === "COMPLETED" ? "Completada" : "Cancelada"}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-soft">Sin historial</div>
        )}
      </Card>
    </div>
  );
}