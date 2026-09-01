"use client";


import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Button, Card } from "@/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels: Record<string, { label: string; class: string }> = {
  WAITING: { label: "Esperando vet", class: "bg-amber-100 text-amber-800" },
  PENDING: { label: "Pendiente", class: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "En curso", class: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Completada", class: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Cancelada", class: "bg-red-100 text-red-800" },
};

export default function ConsultationsListPage() {
  const { data: session } = useSession();
  const { data: consultations } = trpc.consultations.mine.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Mis consultas</h1>
        <p className="text-ink-soft">Historial y estado de tus solicitudes</p>
      </div>

      {consultations?.length === 0 ? (
        <Card className="text-center py-12" padding="lg">
          <svg className="mx-auto h-12 w-12 text-ink-soft/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-ink">No tenés consultas</h3>
          <p className="mt-1 text-ink-soft">Cuando solicites una, aparecerá aquí</p>
          <Link href="/dashboard/consultations/new">
            <Button className="mt-4">Solicitar consulta</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {consultations?.map((c: { id: string; status: string; createdAt: Date | string; pet?: { name: string; species: string; photoUrl?: string | null } | null; vet?: { firstName?: string | null; lastName?: string | null } | null }) => {
            const s = statusLabels[c.status] || { label: c.status, class: "bg-gray-100 text-gray-800" };
            return (
              <Link key={c.id} href={`/dashboard/consultations/${c.id}`} className="flex items-center gap-4 w-full bg-white border border-border rounded-lg p-4 shadow-card hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-[var(--radius-md)] bg-surface flex items-center justify-center flex-shrink-0">
                    {c.pet?.photoUrl ? (
                      <img src={c.pet.photoUrl} alt={c.pet.name} className="w-full h-full object-cover rounded-[var(--radius-md)]" />
                    ) : (
                      <span className="text-3xl">🐾</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-ink truncate">{c.pet?.name || "Mascota"}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.class}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-ink-soft truncate">{c.pet?.species}{c.vet ? ` · Dr. ${c.vet.firstName} ${c.vet.lastName}` : ""}</p>
                    <p className="text-xs text-ink-soft/70 mt-1">Creada: {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}</p>
                  </div>
                  {c.status === "ACTIVE" && (
                    <Button size="sm" className="flex-shrink-0">Entrar</Button>
                  )}
                </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}