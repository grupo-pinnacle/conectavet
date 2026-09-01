"use client";


import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Card, Badge, StatCard, Tabs, Avatar, Input, Button, FilterPanel, DataTable, type DataTableColumn } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Consult = {
  id: string;
  status: string;
  reason?: string | null;
  createdAt: Date | string;
  startedAt?: Date | string | null;
  pet?: { id: string; name: string; species: string; photoUrl?: string | null } | null;
  client?: { firstName?: string | null; lastName?: string | null } | null;
};

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

export default function ConsultasPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("agenda");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: queue } = trpc.consultations.queue.useQuery(undefined, { refetchInterval: 10_000 });
  const { data: active } = trpc.consultations.active.useQuery(undefined, { refetchInterval: 5_000 });
  const { data: mine } = trpc.consultations.mine.useQuery(undefined);
  const setAvailability = trpc.users.setAvailability.useMutation();

  const today = new Date();
  const todayItems: Consult[] = (mine ?? []).filter((c: Consult) => {
    const d = new Date(c.startedAt || c.createdAt);
    return d.toDateString() === today.toDateString();
  });

  const filterFn = (c: Consult) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const pet = c.pet?.name?.toLowerCase() || "";
      const client = `${c.client?.firstName ?? ""} ${c.client?.lastName ?? ""}`.toLowerCase();
      if (!pet.includes(q) && !client.includes(q)) return false;
    }
    return true;
  };

  const columns: DataTableColumn<Consult>[] = [
    {
      key: "time",
      header: "Hora",
      render: (c) => <span className="font-mono text-sm">{format(new Date(c.startedAt || c.createdAt), "HH:mm", { locale: es })}</span>,
    },
    {
      key: "pet",
      header: "Mascota",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar src={c.pet?.photoUrl} name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="sm" />
          <div>
            <p className="font-medium text-ink">{c.pet?.name}</p>
            <p className="text-xs text-ink-soft">{c.pet?.species}</p>
          </div>
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      render: (c) => <span className="text-ink-soft">{c.client?.firstName} {c.client?.lastName}</span>,
    },
    {
      key: "reason",
      header: "Motivo",
      render: (c) => <span className="text-sm text-ink-soft line-clamp-1">{c.reason || "—"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (c) => <Badge variant={statusVariant[c.status]}>{statusLabel[c.status] || c.status}</Badge>,
    },
    {
      key: "action",
      header: "",
      render: (c) => (
        <Link href={`/dashboard/consultations/${c.id}`}>
          <Button size="sm" variant="outline">Ver</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Consultas / Agenda</h1>
          <p className="text-ink-soft">Gestioná tu agenda y solicitudes</p>
        </div>
        <Button
          variant={session?.user ? "outline" : "primary"}
          onClick={() => setAvailability.mutate({ isOnline: !((queue?.length ?? 0) > 0) })}
        >
          {session?.user?.role === "VET" ? "Cambiar disponibilidad" : "Cambiar estado"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hoy" value={todayItems.length} icon="📅" variant="brand" />
        <StatCard label="En cola" value={queue?.length ?? 0} icon="⏱" variant="warning" />
        <StatCard label="Activas" value={active?.length ?? 0} icon="🩺" variant="success" />
        <StatCard label="Completadas" value={(mine ?? []).filter((c: Consult) => c.status === "COMPLETED").length} icon="✓" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "agenda", label: "Agenda" },
          { id: "lista", label: "Lista", badge: mine?.length ?? 0 },
          { id: "solicitudes", label: "Solicitudes", badge: queue?.length ?? 0 },
          { id: "disponibilidad", label: "Disponibilidad" },
        ]}
      />

      {tab === "agenda" && (
        <DataTable<Consult>
          columns={columns}
          rows={todayItems.filter(filterFn)}
          rowKey={(c) => c.id}
          emptyMessage="No hay consultas agendadas para hoy"
        />
      )}

      {tab === "lista" && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <FilterPanel>
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="WAITING">Esperando</option>
                <option value="ACTIVE">En consulta</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </FilterPanel>
          <DataTable<Consult>
            columns={columns}
            rows={(mine ?? []).filter(filterFn)}
            rowKey={(c) => c.id}
            emptyMessage="No hay consultas"
          />
        </div>
      )}

      {tab === "solicitudes" && (
        <DataTable<Consult>
          columns={columns}
          rows={queue ?? []}
          rowKey={(c) => c.id}
          emptyMessage="Sin solicitudes en cola"
        />
      )}

      {tab === "disponibilidad" && (
        <Card padding="lg" className="max-w-xl">
          <h2 className="text-lg font-semibold text-ink mb-2">Tu disponibilidad</h2>
          <p className="text-ink-soft text-sm mb-4">
            Cuando estés disponible, aparecerás en la lista de vets online y se te podrán asignar consultas.
          </p>
          <Button onClick={() => setAvailability.mutate({ isOnline: true })}>Marcarme disponible</Button>
        </Card>
      )}
    </div>
  );
}