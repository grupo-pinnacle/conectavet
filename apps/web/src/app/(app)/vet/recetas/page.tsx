"use client";


import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Tabs, Input, Badge, DataTable, type DataTableColumn, FilterPanel, Button } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Prescription = {
  id: string;
  content: string;
  medication?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  createdAt: Date | string;
  consultation?: { pet?: { name: string } | null } | null;
};

export default function RecetasPage() {
  const [tab, setTab] = useState("lista");
  const [search, setSearch] = useState("");

  // Por ahora usamos el endpoint de consultations para obtener consultas completadas
  // y derivar las recetas. Se conecta a un endpoint de recetas en una próxima iteración.
  const { data: mine } = trpc.consultations.mine.useQuery(undefined);
  const completed = (mine ?? []).filter((c: { status: string }) => c.status === "COMPLETED");

  const filterFn = (p: Prescription) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.content.toLowerCase().includes(q) || (p.medication?.toLowerCase().includes(q) ?? false);
  };

  const columns: DataTableColumn<Prescription>[] = [
    { key: "patient", header: "Paciente", render: (p) => <span className="font-medium">{p.consultation?.pet?.name || "—"}</span> },
    { key: "med", header: "Medicamento", render: (p) => p.medication || "—" },
    { key: "dosage", header: "Dosis/Frecuencia", render: (p) => `${p.dosage || "—"} · ${p.frequency || "—"}` },
    { key: "date", header: "Fecha", render: (p) => <span className="text-sm">{format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })}</span> },
    { key: "status", header: "Estado", render: () => <Badge variant="success">Emitida</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Recetas</h1>
        <p className="text-ink-soft">Gestión de prescripciones</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total emitidas" value={completed.length} icon="💊" variant="brand" />
        <StatCard label="Recientes" value={Math.min(completed.length, 5)} icon="📅" variant="success" />
        <StatCard label="Medicamentos únicos" value={new Set(completed.map((c: { id: string }) => c.id)).size} icon="💉" />
        <StatCard label="Pacientes" value={new Set(completed.map((c: { petId: string }) => c.petId)).size} icon="🐾" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "lista", label: "Lista de Recetas" },
          { id: "nueva", label: "Nueva Receta" },
          { id: "plantillas", label: "Plantillas" },
        ]}
      />

      {tab === "lista" && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <FilterPanel>
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FilterPanel>
          <Card padding="none">
            <DataTable<Prescription>
              columns={columns}
              rows={completed.map((c: { id: string; reason?: string | null; createdAt: Date | string; pet?: { name: string } | null }) => ({
                id: c.id,
                content: c.reason || "",
                medication: "Ver consulta",
                dosage: "—",
                frequency: "—",
                createdAt: c.createdAt,
                consultation: { pet: c.pet },
              })).filter(filterFn)}
              rowKey={(p) => p.id}
              emptyMessage="Sin recetas emitidas"
            />
          </Card>
        </div>
      )}

      {tab === "nueva" && (
        <Card padding="lg" className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink mb-4">Nueva receta</h2>
          <p className="text-ink-soft text-sm mb-4">
            Para crear una receta, abrí la consulta activa y usá la opción &quot;Crear receta&quot; desde el chat.
          </p>
          <Button variant="outline">Ver consultas activas</Button>
        </Card>
      )}

      {tab === "plantillas" && (
        <Card padding="lg" className="max-w-2xl">
          <p className="text-ink-soft">
            Las plantillas te permiten guardar recetas frecuentes (desparasitación, vacunación, etc.) y reutilizarlas con un click.
            Próximamente.
          </p>
        </Card>
      )}
    </div>
  );
}