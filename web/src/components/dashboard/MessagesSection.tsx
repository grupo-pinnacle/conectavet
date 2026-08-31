import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, ArrowLeft, Pill, Clock, CheckCircle2 } from "lucide-react";
import {
  getMessages,
  sendMessage,
  getPrescriptions,
  cancelConsultation,
} from "../../services/endpoints";
import {
  getCachedConsultations,
  updateCachedConsultation,
  getCachedMessages,
  getCachedPrescriptions,
  setCachedMessages,
  setCachedPrescriptions,
  confirmMessage,
  applyMessageEcho,
  upsertPrescription,
  getLastConsultationId,
  setLastConsultationId,
} from "../../services/chatStore";
import { joinConsultation } from "../../services/socket";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useConsultations, useInvalidateConsultations, consultationsKey } from "../../hooks/useConsultations";
import { MessageBubble } from "./MessageBubble";
import CallButton from "../call/CallButton";
import type { Consultation, Message, Prescription } from "../../types";

const INITIAL_LOAD = 50;
const POLL_INTERVAL = 10000;

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function needsDateSeparator(curr: Message, prev: Message | null) {
  if (!prev) return true;
  const c = new Date(curr.createdAt);
  const p = new Date(prev.createdAt);
  return c.toDateString() !== p.toDateString();
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Activa", bg: "bg-green-50", text: "text-green-700" },
  COMPLETED: { label: "Cerrada", bg: "bg-slate-50", text: "text-slate-500" },
  CANCELLED: { label: "Cancelada", bg: "bg-red-50", text: "text-red-600" },
  WAITING: { label: "En cola", bg: "bg-amber-50", text: "text-amber-700" },
  PENDING: { label: "Por confirmar", bg: "bg-sky-50", text: "text-sky-700" },
};

function PrescriptionCard({ rx }: { rx: Prescription }) {
  const hasDetails = rx.medication || rx.dosage || rx.frequency || rx.durationDays || rx.indications;
  return (
    <div className="mb-2 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Pill className="h-4 w-4 text-teal-700" />
        <span className="text-xs font-bold uppercase tracking-wide text-teal-800">
          Receta de {rx.vet?.firstName || "tu veterinario"}
        </span>
        <span className="ml-auto text-[11px] text-slate-400">
          {new Date(rx.createdAt).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {hasDetails && (
        <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-teal-100 bg-white/70 p-3 text-xs">
          {rx.medication && (
            <p><span className="font-bold text-teal-800">Medicación:</span> {rx.medication}</p>
          )}
          {rx.dosage && (
            <p><span className="font-bold text-teal-800">Dosis:</span> {rx.dosage}</p>
          )}
          {rx.frequency && (
            <p><span className="font-bold text-teal-800">Frecuencia:</span> {rx.frequency}</p>
          )}
          {rx.durationDays && (
            <p><span className="font-bold text-teal-800">Duración:</span> {rx.durationDays} días</p>
          )}
          {rx.indications && (
            <p className="col-span-2"><span className="font-bold text-teal-800">Indicaciones:</span> {rx.indications}</p>
          )}
        </div>
      )}
      <p className="whitespace-pre-wrap text-sm text-ink">{rx.content}</p>
    </div>
  );
}

export default function MessagesSection() {
  // Hidratación instantánea desde la caché: los inicializadores lazy corren
  // en el primer render, así al volver a esta sección no hay spinner ni
  // recarga — la conversación y la lista ya están en memoria.
  const { data: consultations = [] } = useConsultations('client');
  const [activeCons, setActiveCons] = useState<Consultation | null>(() => {
    const cached = getCachedConsultations();
    if (!cached) return null;
    const lastId = getLastConsultationId();
    return lastId ? cached.find((c) => c.id === lastId) ?? null : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(() => (getCachedConsultations() ? false : true));
  const [isSending, setIsSending] = useState(false);
  const [showList, setShowList] = useState(() => {
    const cached = getCachedConsultations();
    return !(cached && getLastConsultationId() && cached.some((c) => c.id === getLastConsultationId()));
  });
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeConsRef = useRef<Consultation | null>(null);

  const queryClient = useQueryClient();
  const invalidateConsultations = useInvalidateConsultations('client');
  const patchConsultations = useCallback(
    (updater: (prev: Consultation[]) => Consultation[]) =>
      queryClient.setQueryData(consultationsKey('client'), (prev: Consultation[] | undefined) => updater(prev ?? [])),
    [queryClient]
  );

  useEffect(() => {
    activeConsRef.current = activeCons;
  });

  // Mantener la caché de módulo al día es suficiente; React Query ya trae la
  // lista (useConsultations) y los eventos de socket la invalidan.
  const fetchCons = invalidateConsultations;

  const fetchMsgs = useCallback(async (consultationId: string) => {
    try {
      const data = await getMessages(consultationId);
      const pending = (getCachedMessages(consultationId) ?? [])
        .filter((m) => m.id.startsWith("msg-"))
        .filter((m) => !data.some((d) => d.id === m.id));
      const merged = pending.length ? [...data, ...pending] : data;
      setCachedMessages(consultationId, merged);
    } catch { /* fallback handled */ }
  }, []);

  const fetchPrescriptions = useCallback(async (consultationId: string) => {
    try {
      const data = await getPrescriptions(consultationId);
      setCachedPrescriptions(consultationId, data);
    } catch { /* fallback handled */ }
  }, []);

  // Al cambiar de consulta: hidratá desde la caché (instántaneo) y,
  // si es la primera vez, traé de la API sin pantalla de carga.
  useEffect(() => {
    if (!activeCons) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde caché
    setMessages(getCachedMessages(activeCons.id) ?? []);
    setPrescriptions(getCachedPrescriptions(activeCons.id) ?? []);
    joinConsultation(activeCons.id);
    if (!getCachedMessages(activeCons.id)) fetchMsgs(activeCons.id);
    if (!getCachedPrescriptions(activeCons.id)) fetchPrescriptions(activeCons.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la caché evita refetches; re-sincronizar por objeto causaría bucles
  }, [activeCons?.id, fetchMsgs, fetchPrescriptions]);

  // Mantené la caché al día mientras el usuario está en esta conversación.
  useEffect(() => {
    if (!activeCons) return;
    setCachedMessages(activeCons.id, messages);
  }, [messages, activeCons]);

  useEffect(() => {
    if (!activeCons) return;
    setCachedPrescriptions(activeCons.id, prescriptions);
  }, [prescriptions, activeCons]);

  // Socket global: eventos de mensajes, consultas y notificaciones.
  // La conexión (y el reintento si el handshake falla) vive en useChatSocket,
  // compartido con VetMessagesSection (P2-6). Acá solo registramos los listeners.
  const { socketConnected } = useChatSocket((socket) => {
    const onConnect = () => {
      const active = activeConsRef.current;
      if (active) joinConsultation(active.id);
      invalidateConsultations();
      if (active) {
        fetchMsgs(active.id);
        fetchPrescriptions(active.id);
      }
    };
    socket.on("connect", onConnect);
    socket.on("message:new", (msg: Message) => {
      // Siempre guardamos el echo en la caché de esa consulta, aunque no esté
      // abierta ahora, para que esté caliente al abrirla (P3-13).
      applyMessageEcho(msg.consultationId, msg);
      const active = activeConsRef.current;
      if (active && msg.consultationId === active.id) {
        setMessages(getCachedMessages(active.id) ?? []);
        // El mensaje ya llegó (echo del socket): el botón deja de
        // mostrar "enviando" aunque el POST REST todavía no responda.
        setIsSending(false);
      }
    });
    socket.on("consultation:updated", (updated: Consultation) => {
      updateCachedConsultation(updated);
      patchConsultations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      const active = activeConsRef.current;
      if (active?.id === updated.id) setActiveCons(updated);
    });
    socket.on("consultation:new", () => invalidateConsultations());
    socket.on("prescription:new", (prescription: Prescription) => {
      const active = activeConsRef.current;
      if (active && prescription.consultationId === active.id) {
        upsertPrescription(active.id, prescription);
        setPrescriptions(getCachedPrescriptions(active.id) ?? []);
      }
    });
    socket.on("notification:new", () => invalidateConsultations());
    return () => {
      socket.off("connect");
      socket.off("message:new");
      socket.off("consultation:updated");
      socket.off("consultation:new");
      socket.off("prescription:new");
      socket.off("notification:new");
    };
  }, []);

  // Lista inicial: la caché ya la hidrató en el primer render; acá solo se
  // refresca en segundo plano. Sin polling mientras el socket está vivo.
  useEffect(() => {
    fetchCons();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch de datos al montar
  }, []);

  // Respaldo: solo con el socket caído, refrescá consultas y mensajes.
  useEffect(() => {
    if (socketConnected) return;
    const interval = setInterval(() => {
      fetchCons();
      const active = activeConsRef.current;
      if (active) {
        fetchMsgs(active.id);
        setMessages(getCachedMessages(active.id) ?? []);
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [socketConnected, fetchCons, fetchMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || !activeCons) return;
    const optimisticId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!textOverride) setInput("");
    setIsSending(true);
    const optimistic: Message = {
      id: optimisticId,
      consultationId: activeCons.id,
      senderId: "",
      content: text,
      createdAt: new Date().toISOString(),
      sender: { id: "", email: "", role: "CLIENT" },
    };
    setCachedMessages(activeCons.id, [...(getCachedMessages(activeCons.id) ?? []), optimistic]);
    setMessages(getCachedMessages(activeCons.id) ?? []);
    try {
      const msg = await sendMessage(activeCons.id, text);
      confirmMessage(activeCons.id, optimisticId, msg);
      setFailedIds((prev) => {
        const next = new Set(prev);
        next.delete(optimisticId);
        return next;
      });
      setMessages(getCachedMessages(activeCons.id) ?? []);
    } catch {
      setFailedIds((prev) => new Set(prev).add(optimisticId));
      setMessages((prev) => prev.map((m) =>
        m.id === optimisticId ? { ...m, status: "failed" } as Message : m
      ));
    } finally {
      setIsSending(false);
    }
  }, [input, activeCons]);

  const activeList = useMemo(
    () => consultations.filter((c) => c.status === "ACTIVE"),
    [consultations]
  );
  const pendingList = useMemo(
    () => consultations.filter((c) => c.status === "PENDING" || c.status === "WAITING"),
    [consultations]
  );
  const messageList = useMemo(
    () => messages.slice(-INITIAL_LOAD),
    [messages]
  );

  const waitingForVet = activeCons?.status === "PENDING" || activeCons?.status === "WAITING";

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <div
        className={`w-full shrink-0 border-r border-border md:w-80 ${showList ? "block" : "hidden md:block"}`}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Mensajes</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {activeList.length} activas · {pendingList.length} pendientes
          </p>
        </div>
        <div ref={listRef} className="overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
          {loading && (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent mr-2" />
              Cargando...
            </div>
          )}
          {!loading && consultations
            .filter(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED')
            .length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-slate-400">
              <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-500">Sin chats activos</p>
              <p className="mt-1 text-xs">Las consultas finalizadas están en tu Historial</p>
            </div>
          )}
          {!loading && consultations
            .filter(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED')
            .map((c) => {
            const isSelected = activeCons?.id === c.id;
            const cfg = statusConfig[c.status] || statusConfig.WAITING;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCons(c); setShowList(false); setLastConsultationId(c.id); }}
                className={`flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left transition-all hover:bg-slate-50 ${
                  isSelected ? "bg-teal-50/60 shadow-[inset_3px_0_0_0_#0F766E]" : ""
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                  {c.pet?.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-ink text-sm">
                      {c.pet?.name || "Mascota"}
                    </p>
                    <span className={`shrink-0 text-[10px] ${isSelected ? "text-teal-700 font-semibold" : "text-slate-400"}`}>
                      {formatTimeAgo(c.updatedAt || c.createdAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500 mt-0.5">
                    {c.vet?.firstName || c.vet?.email || "Veterinario"}
                  </p>
                </div>
                <span className={`flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat pane */}
      <div
        className={`flex flex-1 flex-col ${showList ? "hidden md:flex" : "flex"}`}
      >
        {!activeCons ? (
          <div className="flex flex-1 flex-col items-center justify-center text-sm text-slate-400 px-6">
            <MessageSquare className="mb-4 h-16 w-16 text-slate-200" />
            <p className="text-lg font-semibold text-slate-500">Seleccioná una consulta</p>
            <p className="mt-1 text-xs">Elegí una conversación del panel izquierdo para ver los mensajes</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-white px-5 py-4">
              <button
                onClick={() => setShowList(true)}
                className="mr-1 md:hidden"
              >
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 shrink-0">
                {activeCons.pet?.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink truncate">
                  {activeCons.pet?.name || "Mascota"}
                </p>
                <p className="text-xs text-slate-500">
                  con {activeCons.vet?.firstName || activeCons.vet?.email || "Veterinario"}
                </p>
              </div>
              <span className={`flex h-6 items-center rounded-full px-3 text-xs font-semibold ${
                activeCons.status === "ACTIVE"
                  ? "bg-green-50 text-green-700"
                  : activeCons.status === "PENDING"
                    ? "bg-sky-50 text-sky-700"
                    : activeCons.status === "WAITING"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-50 text-slate-500"
              }`}>
                {activeCons.status === "ACTIVE"
                  ? "En consulta"
                  : activeCons.status === "PENDING"
                    ? "Por confirmar"
                    : activeCons.status === "WAITING"
                      ? "En cola de espera"
                      : "Finalizada"}
              </span>
              {activeCons.status === "ACTIVE" && (
                <CallButton
                  consultationId={activeCons.id}
                  peerName={activeCons.vet?.firstName || activeCons.vet?.email || "el veterinario"}
                />
              )}
              {(activeCons.status === "WAITING" || activeCons.status === "PENDING") && (
                <button
                  onClick={async () => {
                    try {
                      const updated = await cancelConsultation(activeCons.id);
                      updateCachedConsultation(updated);
                      patchConsultations((prev) =>
                        prev.map((c) => (c.id === updated.id ? updated : c))
                      );
                      setActiveCons(updated);
                    } catch (error) {
                      console.error("Error al cancelar la consulta", error);
                    }
                  }}
                  className="rounded-full px-4 py-1.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>

            {waitingForVet && (
              <div className="flex items-start gap-2.5 border-b border-sky-100 bg-sky-50/70 px-5 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <div>
                  <p className="text-xs font-bold text-sky-800">
                    {activeCons.status === "PENDING"
                      ? "Esperando confirmación del veterinario"
                      : "En cola de espera"}
                  </p>
                  <p className="text-xs text-sky-700/80">
                    {activeCons.status === "PENDING"
                      ? "El veterinario está revisando la consulta. Cuando la acepte, van a poder chatear."
                      : "Se asignará un veterinario disponible en breve."}
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-0.5">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
                {messageList.map((msg, idx) => {
                  const prev = idx > 0 ? messageList[idx - 1] : null;
                  const isOwn = msg.sender?.role === "CLIENT";
                  const showSender = !isOwn && (idx === 0 || messageList[idx - 1]?.sender?.id !== msg.sender?.id);
                  const isOptimistic = msg.id.startsWith("msg-");
                  const isFailed = isOptimistic && failedIds.has(msg.id);
                  return (
                    <div key={msg.id} className="relative group">
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        senderLabel={activeCons.vet?.firstName || "Veterinario"}
                        showSender={showSender}
                        showDateSeparator={needsDateSeparator(msg, prev)}
                      />
                      {isFailed && (
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className="text-[11px] text-red-500 font-semibold">Error al enviar</span>
                          <button
                            onClick={() => {
                              setFailedIds((prev) => {
                                const next = new Set(prev);
                                next.delete(msg.id);
                                return next;
                              });
                              setCachedMessages(activeCons.id, (getCachedMessages(activeCons.id) ?? []).filter((m) => m.id !== msg.id));
                              setMessages(getCachedMessages(activeCons.id) ?? []);
                              handleSend(msg.content);
                            }}
                            className="text-[11px] text-teal-700 font-bold hover:underline"
                          >
                            Reintentar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {activeCons.status === "ACTIVE" ? (
              <div className="border-t border-border bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-shadow"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isSending}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-teal-800 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isSending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline ml-1">Enviar</span>
                  </button>
                </div>
              </div>
            ) : (
              !waitingForVet && (
                <div className="border-t border-border bg-slate-50 px-5 py-3.5">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Consulta finalizada. Podés ver el historial en la sección Historial.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
