import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Clock, CheckCircle, MessageSquare, ArrowLeft, FileText } from "lucide-react";
import Button from "../../Button";
import {
  getMyConsultations,
  assignConsultation,
  completeConsultation,
  getMessages,
  sendMessage,
} from "../../../services/endpoints";
import { connectSocket, joinConsultation } from "../../../services/socket";
import { MessageBubble } from "../MessageBubble";
import VetPatientProfile from "./VetPatientProfile";
import type { Consultation, Message } from "../../../types";

type Tab = "waiting" | "active";

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

export default function VetMessagesSection() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeCons, setActiveCons] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [loadingCons, setLoadingCons] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [showList, setShowList] = useState(true);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [showPatientProfile, setShowPatientProfile] = useState(false);

  // Track optimistic messages by their msg- ID so we know which are failed
  const failedMessagesRef = useRef<Set<string>>(new Set());

  const fetchConsultations = useCallback(async () => {
    try {
      const data = await getMyConsultations();
      setConsultations(data);
    } catch { /* polling handled */ }
    setLoadingCons(false);
  }, []);

  const fetchMsgs = useCallback(async () => {
    if (!activeCons) return;
    try {
      const data = await getMessages(activeCons.id);
      setMessages((prev) => {
        if (prev.length === data.length && prev[0]?.id === data[0]?.id) return prev;
        return data;
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
          return [...prev, msg];
        });
      });
      socket.on("consultation:updated", (updated: Consultation) => {
        if (updated.id === activeCons.id) setActiveCons(updated);
        setConsultations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      });
      socket.on("consultation:new", (newCons: Consultation) => {
        setConsultations((prev) => {
          if (prev.some((c) => c.id === newCons.id)) return prev;
          return [...prev, newCons];
        });
      });
    });
    return () => {
      cancelled = true;
      if (s) {
        s.off("message:new");
        s.off("consultation:updated");
        s.off("consultation:new");
      }
    };
  }, [activeCons?.id]);

  useEffect(() => {
    fetchConsultations();
    const interval = setInterval(fetchConsultations, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchConsultations]);

  useEffect(() => {
    if (!activeCons) return;
    fetchMsgs();
    const interval = setInterval(fetchMsgs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeCons?.id, fetchMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const waitingList = useMemo(
    () => consultations.filter((c) => c.status === "WAITING"),
    [consultations]
  );
  const activeList = useMemo(
    () => consultations.filter((c) => c.status === "ACTIVE"),
    [consultations]
  );
  const displayList = tab === "waiting" ? waitingList : activeList;

  const messageList = useMemo(
    () => messages.slice(-INITIAL_LOAD),
    [messages]
  );

  const handleAssign = useCallback(async (id: string) => {
    try {
      const updated = await assignConsultation(id);
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setActiveCons(updated);
      setShowList(false);
      setTab("active");
    } catch {
      alert("Error al tomar la consulta");
    }
  }, []);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || !activeCons) return;
    setIsSending(true);
    const optimisticId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!textOverride) setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        consultationId: activeCons.id,
        senderId: "",
        content: text,
        createdAt: new Date().toISOString(),
        sender: { id: "", email: "", role: "VET" },
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

  const handleClose = useCallback(async () => {
    if (!activeCons) return;
    setClosing(true);
    try {
      const updated = await completeConsultation(activeCons.id, closeNotes);
      setConsultations((prev) =>
        prev.map((c) => (c.id === activeCons.id ? updated : c))
      );
      setActiveCons(null);
      setShowCloseModal(false);
      setCloseNotes("");
    } catch {
      alert("Error al cerrar consulta");
    } finally {
      setClosing(false);
    }
  }, [activeCons, closeNotes]);

  const activeName = activeCons
    ? `${activeCons.client?.firstName || activeCons.client?.email || "Cliente"} — ${activeCons.pet?.name || "Mascota"}`
    : "";

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <div
        className={`w-full shrink-0 border-r border-border md:w-80 ${showList ? "block" : "hidden md:block"}`}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Consultas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {waitingList.length} disponibles · {activeList.length} activas
          </p>
        </div>
        <div className="flex border-b border-border">
          <button
            onClick={() => { setTab("active"); setActiveCons(null); }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              tab === "active"
                ? "border-b-2 border-teal-700 text-teal-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Activas ({activeList.length})
          </button>
          <button
            onClick={() => { setTab("waiting"); setActiveCons(null); }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              tab === "waiting"
                ? "border-b-2 border-teal-700 text-teal-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Disponibles ({waitingList.length})
          </button>
        </div>
        <div ref={listRef} className="overflow-y-auto" style={{ height: "calc(100% - 117px)" }}>
          {loadingCons && (
            <div className="flex items-center justify-center py-20 text-sm text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent mr-2" />
              Cargando...
            </div>
          )}
          {!loadingCons && displayList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-slate-400 px-6">
              {tab === "waiting" ? (
                <>
                  <Clock className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-500">No hay consultas disponibles</p>
                  <p className="mt-1 text-xs text-center">Cuando un dueño solicite una consulta, aparecerá aquí</p>
                </>
              ) : (
                <>
                  <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-500">No tenés consultas activas</p>
                  <p className="mt-1 text-xs text-center">Las consultas que tomes aparecerán acá</p>
                </>
              )}
            </div>
          )}
          {!loadingCons && displayList.map((c) => {
            const isSelected = activeCons?.id === c.id;
            return (
              <div key={c.id}>
                <button
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
                      <p className="truncate font-semibold text-ink text-sm">
                        {c.pet?.name || "Mascota"}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500 mt-0.5">
                      {c.client?.firstName || c.client?.email || "Cliente"}
                    </p>
                    {c.notes && (
                      <p className="mt-1 text-xs text-slate-600 italic line-clamp-2 leading-tight">
                        "{c.notes}"
                      </p>
                    )}
                  </div>
                  {c.status === "WAITING" && (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-700">
                      <Clock className="h-3 w-3" /> Espera
                    </span>
                  )}
                  {c.status === "ACTIVE" && (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 text-[11px] font-semibold text-green-700">
                      <CheckCircle className="h-3 w-3" /> Activa
                    </span>
                  )}
                </button>
                {tab === "waiting" && (
                  <div className="border-b border-border px-5 py-2.5 bg-amber-50/30">
                    <Button
                      size="sm"
                      fullWidth={false}
                      className="w-full"
                      onClick={() => handleAssign(c.id)}
                    >
                      Tomar consulta
                    </Button>
                  </div>
                )}
              </div>
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
            <p className="mt-1 text-xs text-center">Elegí una conversación del panel izquierdo para atender al paciente</p>
          </div>
        ) : (
          <>
            {/* Header */}
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
                <p className="font-bold text-ink truncate">{activeName}</p>
                <p className="text-xs text-slate-500">
                  {activeCons.status === "ACTIVE" ? "En consulta" : "Esperando asignación"}
                </p>
                {activeCons.notes && (
                  <p className="text-xs text-slate-600 italic mt-0.5 truncate">
                    "{activeCons.notes}"
                  </p>
                )}
              </div>
              {activeCons.pet?.id && (
                <button
                  onClick={() => setShowPatientProfile(true)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Ver historial clínico"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Historial</span>
                </button>
              )}
              {activeCons.status === "ACTIVE" && (
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setShowCloseModal(true)}
                >
                  Cerrar consulta
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-0.5">
                {messageList.map((msg, idx) => {
                  const prev = idx > 0 ? messageList[idx - 1] : null;
                  const isVet = msg.sender?.role === "VET" || msg.sender?.role === "ADMIN";
                  const showSender = !isVet && (idx === 0 || messageList[idx - 1]?.sender?.id !== msg.sender?.id);
                  const isOptimistic = msg.id.startsWith("msg-");
                  const isFailed = isOptimistic && failedMessagesRef.current.has(msg.id);
                  return (
                    <div key={msg.id} className="relative group">
                      <MessageBubble
                        message={msg}
                        isOwn={isVet}
                        senderLabel={activeCons.client?.firstName || "Cliente"}
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

            {/* Input */}
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
                  onClick={handleSend}
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
          </>
        )}
      </div>

      {/* Patient profile */}
      {showPatientProfile && activeCons?.pet?.id && (
        <VetPatientProfile
          petId={activeCons.pet.id}
          petName={activeCons.pet.name || "Mascota"}
          onClose={() => setShowPatientProfile(false)}
        />
      )}

      {/* Close modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="mb-2 text-lg font-bold text-ink">Cerrar consulta</h3>
            <p className="mb-4 text-sm text-slate-500">
              Agregá notas para el historial de{" "}
              <span className="font-semibold text-ink">
                {activeCons?.pet?.name || "la mascota"}
              </span>{" "}
              (opcional):
            </p>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Diagnóstico, tratamiento, recomendaciones..."
              rows={4}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => { setShowCloseModal(false); setCloseNotes(""); }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth={false}
                loading={closing}
                onClick={handleClose}
              >
                Confirmar cierre
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
