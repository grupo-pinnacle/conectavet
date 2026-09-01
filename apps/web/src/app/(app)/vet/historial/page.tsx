"use client";


import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Tabs, Input, Avatar, Badge, FilterPanel, DataTable, type DataTableColumn } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Consult = {
  id: string;
  status: string;
  reason?: string | null;
  createdAt: Date | string;
  pet?: { id: string; name: string; species: string; photoUrl?: string | null } | null;
  client?: { firstName?: string | null; lastName?: string | null } | null;
};

export default function HistorialPage() {
  const [tab, setTab] = useState("recientes");
  const [search, setSearch] = useState("");

  const { data: mine } = trpc.consultations.mine.useQuery(undefined);
  const completed = (mine ?? []).filter((c: Consult) => c.status === "COMPLETED");

  const recentPatients = Array.from(
    new Map(
      completed.map((c: Consult) => [c.pet?.id, c.pet])
        .filter((entry): entry is [string, NonNullable<Consult["pet"]>] => !!entry[1])
    ).values()
  );

  const filterFn = (c: Consult) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return !!c.pet?.name.toLowerCase().includes(q);
  };

  const columns: DataTableColumn<Consult>[] = [
    {
      key: "date",
      header: "Fecha",
      render: (c) => <span className="text-sm">{format(new Date(c.createdAt), "dd MMM yyyy", { locale: es })}</span>,
    },
    {
      key: "pet",
      header: "Mascota",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Avatar src={c.pet?.photoUrl} name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="sm" />
          <span className="font-medium">{c.pet?.name}</span>
        </div>
      ),
    },
    { key: "reason", header: "Motivo", render: (c) => <span className="text-sm text-ink-soft line-clamp-1">{c.reason || "—"}</span> },
    { key: "status", header: "Estado", render: (c) => <Badge variant="neutral">Completada</Badge> },
    {
      key: "view",
      header: "",
      render: (c) => (
        <Link href={`/dashboard/consultations/${c.id}`} className="text-sm text-brand hover:underline">
          Ver historial
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Historial clínico</h1>
        <p className="text-ink-soft">Consultas y registros de pacientes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total registros" value={completed.length} icon="📋" variant="brand" />
        <StatCard label="Consultas recientes" value={completed.slice(0, 5).length} icon="🩺" variant="success" />
        <StatCard label="Recetas emitidas" value={completed.length} icon="💊" />
        <StatCard label="Pacientes únicos" value={recentPatients.length} icon="🐾" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "buscar", label: "Búsqueda de Pacientes" },
          { id: "recientes", label: "Registros Recientes" },
        ]}
      />

      {tab === "buscar" && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <FilterPanel>
            <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FilterPanel>
          <DataTable<Consult>
            columns={columns}
            rows={completed.filter(filterFn)}
            rowKey={(c) => c.id}
            emptyMessage="Sin registros"
          />
        </div>
      )}

      {tab === "recientes" && (
        <>
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-ink mb-3">Últimos pacientes vistos</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentPatients.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-surface rounded-[var(--radius-md)]">
                  <Avatar src={p.photoUrl} name={p.name ?? undefined} alt={p.name ?? "Mascota"} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{p.name}</p>
                    <p className="text-xs text-ink-soft">{p.species}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-semibold text-ink mb-3">Último registro médico</h3>
            {completed[0] ? (
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium text-ink">Fecha:</span> {format(new Date(completed[0].createdAt), "PPP", { locale: es })}</p>
                <p className="text-sm"><span className="font-medium text-ink">Mascota:</span> {completed[0].pet?.name}</p>
                <p className="text-sm"><span className="font-medium text-ink">Motivo:</span> {completed[0].reason}</p>
              </div>
            ) : (
              <p className="text-ink-soft">Sin registros aún</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}