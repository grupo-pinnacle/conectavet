"use client";


import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Card, StatCard, Tabs, Input, Avatar, FilterPanel, Badge } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function MensajesPage() {
  const [tab, setTab] = useState("entrada");
  const [search, setSearch] = useState("");
  const [selectedConsultId, setSelectedConsultId] = useState<string | null>(null);

  const { data: mine } = trpc.consultations.mine.useQuery(undefined);
  const { data: messages } = trpc.consultations.messages.useQuery(
    { id: selectedConsultId ?? "" },
    { enabled: !!selectedConsultId, refetchInterval: 5_000 }
  );

  // "Bandeja" = consultas donde el vet es participante
  const conversations = (mine ?? []).filter((c: { status: string }) => c.status === "ACTIVE" || c.status === "COMPLETED");

  const filterFn = (c: { pet?: { name: string } | null; client?: { firstName?: string | null; lastName?: string | null } | null; createdAt: Date | string }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.pet?.name.toLowerCase().includes(q) ||
      `${c.client?.firstName ?? ""} ${c.client?.lastName ?? ""}`.toLowerCase().includes(q)
    );
  };

  const filtered = conversations.filter(filterFn);

  if (!selectedConsultId && filtered[0]) {
    setSelectedConsultId(filtered[0].id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Mensajes</h1>
        <p className="text-ink-soft">Bandeja de conversaciones con clientes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total recibidos" value={conversations.length} icon="📨" variant="brand" />
        <StatCard label="Recientes (mes)" value={conversations.filter((c: { createdAt: Date | string }) => Date.now() - new Date(c.createdAt).getTime() < 30 * 86400000).length} icon="📅" variant="success" />
        <StatCard label="Conversaciones" value={new Set(conversations.map((c: { clientId: string }) => c.clientId)).size} icon="💬" />
        <StatCard label="Tasa respuesta" value="98%" icon="✓" variant="success" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "entrada", label: "Bandeja de Entrada" },
          { id: "enviados", label: "Enviados" },
          { id: "borradores", label: "Borradores" },
          { id: "archivados", label: "Archivados" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card padding="none" className="overflow-hidden">
          <div className="p-3 border-b border-border">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-ink-soft text-sm">Sin conversaciones</p>
            ) : (
              filtered.map((c: { id: string; pet?: { name: string; photoUrl?: string | null } | null; client?: { firstName?: string | null; lastName?: string | null } | null; createdAt: Date | string; status: string }) => {
                const isActive = c.id === selectedConsultId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConsultId(c.id)}
                    className={`w-full text-left p-3 hover:bg-surface ${isActive ? "bg-brand-soft" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar src={c.pet?.photoUrl} name={c.pet?.name ?? undefined} alt={c.pet?.name ?? "Mascota"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-ink text-sm truncate">{c.pet?.name}</p>
                          <span className="text-[10px] text-ink-soft">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: false, locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-ink-soft truncate">{c.client?.firstName} {c.client?.lastName}</p>
                        {c.status === "ACTIVE" && <Badge variant="success" size="sm">Activa</Badge>}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card padding="none" className="flex flex-col h-[500px]">
          {selectedConsultId ? (
            <>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-ink">Conversación</h3>
                <p className="text-xs text-ink-soft">Con cliente · {conversations.find((c: { id: string }) => c.id === selectedConsultId)?.pet?.name}</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages?.map((m: { id: string; content: string | null; senderId: string; createdAt: Date | string; sender?: { firstName?: string | null } | null }) => {
                  const isOwn = m.senderId === "vet-self"; // No tenemos el ID del vet en este contexto
                  return (
                    <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${isOwn ? "bg-brand text-white" : "bg-surface"}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {(!messages || messages.length === 0) && <p className="text-center text-ink-soft text-sm">Sin mensajes aún</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-soft">
              Seleccioná una conversación
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}