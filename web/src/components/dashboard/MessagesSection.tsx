import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, MessageSquare, ArrowLeft, Pill } from "lucide-react";
import {
  getMyConsultations,
  getMessages,
  sendMessage,
  getPrescriptions,
} from "../../services/endpoints";
import { connectSocket, joinConsultation } from "../../services/socket";
import { MessageBubble } from "./MessageBubble";
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

export default function MessagesSection() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeCons, setActiveCons] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const failedMessagesRef = useRef<Set<string>>(new Set());

  const fetchCons = useCallback(async () => {
    try {
      const data = await getMyConsultations();
      setConsultations((prev) => {
        const merged = [...data];
        for (const c of prev) {
          if (!merged.find((m) => m.id === c.id)) merged.push(c);
        }
        return merged;
      });
    } catch { /* polling handled */ }
    setLoading(false);
  }, []);

  const fetchMsgs = useCallback(async () => {
    if (!activeCons) return;
    try {
      const data = await getMessages(activeCons.id);
      setMessages((prev) => {
        if (prev.length === data.length && prev[0]?.id === data[0]?.id) return prev;
        const pending = prev.filter(
          (m) => m.id.startsWith("msg-") && !data.some((d) => d.id === m.id)
        );
        return pending.length ? [...data, ...pending] : data;
      });
    } catch { /* polling handled */ }
  }, [activeCons]);

  useEffect(() => {
    if (!activeCons) return;
    let cancelled = false;
    let s: Awaited<ReturnType<typeof connectSocket>> | null = null;
    connectSocket().then((socket) => {
      if (cancelled) return;
      s = socket;
      joinConsultation(activeCons.id);
      socket.on("message:new", (msg: Message) => {
        if (msg.consultationId !== activeCons.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optimistic = prev.find(
            (m) =>
              m.id.startsWith("msg-") &&
              m.content === msg.content &&
              (typeof m.sender?.role === "string"
                ? m.sender.role === msg.sender?.role
                : true)
          );
          if (optimistic) {
            return prev.map((m) => (m.id === optimistic.id ? msg : m));
          }
          return [...prev, msg];
        });
      });
      socket.on("consultation:updated", (updated: Consultation) => {
        if (updated.id !== activeCons.id) return;
        setActiveCons(updated);
        setConsultations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      });
      socket.on("prescription:new", (prescription: Prescription) => {
        if (prescription.consultationId !== activeCons.id) return;
        setPrescriptions((prev) =>
          prev.some((p) => p.id === prescription.id) ? prev : [...prev, prescription]
        );
      });
    });
    return () => {
      cancelled = true;
      if (s) {
        s.off("message:new");
        s.off("consultation:updated");
        s.off("prescription:new");
      }
    };
  }, [activeCons?.id]);

  useEffect(() => {
    fetchCons();
    const interval = setInterval(fetchCons, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCons]);

  useEffect(() => {
    if (!activeCons) return;
    fetchMsgs();
    getPrescriptions(activeCons.id)
      .then((data) => setPrescriptions(data))
      .catch(() => { /* polling handled */ });
    const interval = setInterval(fetchMsgs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeCons?.id, fetchMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || !activeCons) return;
    const optimisticId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!textOverride) setInput("");
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        consultationId: activeCons.id,
        senderId: "",
        content: text,
        createdAt: new Date().toISOString(),
        sender: { id: "", email: "", role: "CLIENT" },
      } as Message,
    ]);
    try {
      const msg = await sendMessage(activeCons.id, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? msg : m))
      );
      failedMessagesRef.current.delete(optimisticId);
    } catch {
      failedMessagesRef.current.add(optimisticId);
      setMessages((prev) => prev.map((m) =>
        m.id === optimisticId ? { ...m, status: "failed" } as any : m
      ));
    } finally {
      setIsSending(false);
    }
  }, [input, activeCons]);

  const activeList = useMemo(
    () => consultations.filter((c) => c.status === "ACTIVE"),
    [consultations]
  );
  const completedList = useMemo(
    () => consultations.filter((c) => c.status === "COMPLETED"),
    [consultations]
  );

  const messageList = useMemo(
    () => messages.slice(-INITIAL_LOAD),
    [messages]
  );

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    ACTIVE: { label: "Activa", bg: "bg-green-50", text: "text-green-700" },
    COMPLETED: { label: "Cerrada", bg: "bg-slate-50", text: "text-slate-500" },
    CANCELLED: { label: "Cancelada", bg: "bg-red-50", text: "text-red-600" },
    WAITING: { label: "Espera", bg: "bg-amber-50", text: "text-amber-700" },
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <div
        className={`w-full shrink-0 border-r border-border md:w-80 ${showList ? "block" : "hidden md:block"}`}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Mensajes</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {activeList.length} activas · {completedList.length} finalizadas
          </p>
        </div>
        <div ref={listRef} className="overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
          {loading && (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent mr-2" />
              Cargando...
            </div>
          )}
          {!loading && consultations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-slate-400">
              <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-500">Sin consultas todavía</p>
              <p className="mt-1 text-xs">Solicitá una desde la sección Consultas</p>
            </div>
          )}
          {!loading && consultations.map((c) => {
            const isSelected = activeCons?.id === c.id;
            const cfg = statusConfig[c.status] || statusConfig.WAITING;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCons(c); setShowList(false); }}
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
                  : activeCons.status === "WAITING"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-50 text-slate-500"
              }`}>
                {activeCons.status === "ACTIVE"
                  ? "En consulta"
                  : activeCons.status === "WAITING"
                    ? "En cola de espera"
                    : "Finalizada"}
              </span>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-0.5">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="mb-2 rounded-xl border border-teal-100 bg-teal-50/50 p-4"
                  >
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
                    <p className="whitespace-pre-wrap text-sm text-ink">{rx.content}</p>
                  </div>
                ))}
                {messageList.map((msg, idx) => {
                  const prev = idx > 0 ? messageList[idx - 1] : null;
                  const isOwn = msg.sender?.role === "CLIENT";
                  const showSender = !isOwn && (idx === 0 || messageList[idx - 1]?.sender?.id !== msg.sender?.id);
                  const isOptimistic = msg.id.startsWith("msg-");
                  const isFailed = isOptimistic && failedMessagesRef.current.has(msg.id);
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
                              failedMessagesRef.current.delete(msg.id);
                              setMessages((prev) => prev.filter((m) => m.id !== msg.id));
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

            {activeCons.status === "ACTIVE" && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
