"use client";


import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Tabs, Input, Avatar, Badge, DataTable, type DataTableColumn, FilterPanel } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  photoUrl?: string | null;
  owner?: { firstName?: string | null; lastName?: string | null } | null;
  updatedAt?: Date | string;
};

export default function PacientesPage() {
  const [tab, setTab] = useState("lista");
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");

  // El vet ve las mascotas que atendió
  const { data: managed } = trpc.pets.managed.useQuery(undefined);

  const filterFn = (p: Pet) => {
    if (speciesFilter !== "all" && p.species !== speciesFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.breed?.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const columns: DataTableColumn<Pet>[] = [
    {
      key: "pet",
      header: "Mascota",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Avatar src={p.photoUrl} name={p.name} alt={p.name} size="sm" />
          <div>
            <p className="font-medium text-ink">{p.name}</p>
            <p className="text-xs text-ink-soft">{p.species}{p.breed ? ` · ${p.breed}` : ""}</p>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Propietario",
      render: (p) => <span className="text-ink-soft">{p.owner?.firstName} {p.owner?.lastName}</span>,
    },
    {
      key: "last",
      header: "Última consulta",
      render: (p) => p.updatedAt ? <span className="text-sm text-ink-soft">{format(new Date(p.updatedAt), "dd MMM", { locale: es })}</span> : "—",
    },
    {
      key: "status",
      header: "Estado",
      render: () => <Badge variant="success">Activo</Badge>,
    },
  ];

  const allPets = (managed ?? []) as Pet[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Pacientes</h1>
        <p className="text-ink-soft">Mascotas que has atendido</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes totales" value={allPets.length} icon="🐾" variant="brand" />
        <StatCard label="Activos" value={allPets.length} icon="✓" variant="success" />
        <StatCard label="Perros" value={allPets.filter((p) => p.species === "Perro").length} icon="🐶" />
        <StatCard label="Gatos" value={allPets.filter((p) => p.species === "Gato").length} icon="🐱" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "lista", label: "Lista de Pacientes" },
          { id: "nuevo", label: "Añadir Nuevo" },
        ]}
      />

      {tab === "lista" && (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <FilterPanel>
            <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1">Especie</label>
              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="all">Todas</option>
                <option value="Perro">Perros</option>
                <option value="Gato">Gatos</option>
                <option value="Otro">Otros</option>
              </select>
            </div>
          </FilterPanel>
          <DataTable<Pet>
            columns={columns}
            rows={allPets.filter(filterFn)}
            rowKey={(p) => p.id}
            emptyMessage="Sin pacientes"
          />
        </div>
      )}

      {tab === "nuevo" && (
        <Card padding="lg" className="max-w-xl">
          <p className="text-ink-soft">
            Los pacientes se registran automáticamente cuando un dueño agenda una consulta. Si necesitás agregar manualmente,
            pedile al cliente que cree su cuenta y registre a su mascota desde la app.
          </p>
        </Card>
      )}
    </div>
  );
}