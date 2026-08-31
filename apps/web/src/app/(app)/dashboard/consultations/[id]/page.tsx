"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/react";
import { Button, Input, Card, CardHeader, Textarea } from "@/components/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ConsultationChatPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: consultation } = trpc.consultations.byId.useQuery({ id: consultationId }, { enabled: !!consultationId });
  const { data: messages } = trpc.consultations.messages.useQuery({ id: consultationId }, { enabled: !!consultationId, refetchInterval: 3000 });
  const sendMutation = trpc.consultations.sendMessage.useMutation();
  const completeMutation = trpc.consultations.complete.useMutation();

  const isVet = session?.user.role === "VET";
  const isClient = session?.user.role === "CLIENT";
  const isParticipant = consultation && (consultation.clientId === session?.user.id || consultation.vetId === session?.user.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!consultation || !isParticipant) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card padding="lg" className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-ink">Consulta no encontrada</h2>
          <p className="mt-2 text-ink-soft">No tenés acceso a esta consulta o no existe.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/consultations")}>Volver</Button>
        </Card>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !uploading) return;
    const clientMsgId = crypto.randomUUID();
    sendMutation.mutate({ consultationId, content: newMessage, clientMsgId });
    setNewMessage("");
  };

  const handleComplete = () => {
    if (confirm("¿Marcar consulta como completada?")) {
      completeMutation.mutate({ id: consultationId, data: { notes: "" } });
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white border-b border-border sticky top-16 z-10">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
          {consultation.pet?.photoUrl ? (
            <img src={consultation.pet.photoUrl} alt={consultation.pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl">🐾</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-ink truncate">{consultation.pet?.name}</h1>
          <p className="text-sm text-ink-soft">{consultation.pet?.species} · {statusLabels[consultation.status]?.label || consultation.status}</p>
        </div>
        {isVet && consultation.status === "ACTIVE" && (
          <Button variant="outline" size="sm" onClick={handleComplete}>Completar</Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        {messages?.map((msg: { id: string; senderId: string; content: string | null; attachmentUrl?: string | null; createdAt: Date | string; sender?: { firstName?: string | null; lastName?: string | null } | null }) => {
          const isOwn = msg.senderId === session?.user.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] ${isOwn ? "flex flex-col items-end" : "flex flex-col items-start"}`}>
                {!isOwn && (
                  <p className="text-xs text-ink-soft mb-1 px-1">
                    {msg.sender?.firstName} {msg.sender?.lastName}
                  </p>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl ${isOwn ? "bg-brand text-white rounded-br-md" : "bg-surface text-ink rounded-bl-md"}`}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.attachmentUrl && (
                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      {msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={msg.attachmentUrl} alt="Adjunto" className="max-w-xs rounded-[var(--radius-md)]" />
                      ) : (
                        <span className="text-sm underline">📎 Ver adjunto</span>
                      )}
                    </a>
                  )}
                  <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-ink-soft/70"}`}>
                    {format(new Date(msg.createdAt), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {consultation.status === "ACTIVE" && (
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-border sticky bottom-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1"
              disabled={sendMutation.isPending}
            />
            <Button type="submit" size="lg" loading={sendMutation.isPending} disabled={!newMessage.trim()}>
              Enviar
            </Button>
          </div>
        </form>
      )}

      {consultation.status === "WAITING" && (
        <div className="p-4 bg-amber-50 border-t border-amber-200 text-center">
          <p className="text-amber-800">Esperando a que un veterinario tome la consulta...</p>
        </div>
      )}
      {consultation.status === "COMPLETED" && (
        <div className="p-4 bg-green-50 border-t border-green-200 text-center">
          <p className="text-green-800">Consulta completada. <a href={`/dashboard/consultations/${consultationId}/rate`} className="underline text-brand font-medium">Calificar</a></p>
        </div>
      )}
    </div>
  );
}

const statusLabels: Record<string, { label: string }> = {
  WAITING: { label: "Esperando veterinario" },
  PENDING: { label: "Pendiente" },
  ACTIVE: { label: "En curso" },
  COMPLETED: { label: "Completada" },
  CANCELLED: { label: "Cancelada" },
};