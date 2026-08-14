import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Clock, CheckCircle, MessageSquare, ArrowLeft, FileText, Pill, Venus, Mars, XCircle, UserRound } from "lucide-react";
import Button from "../../Button";
import {
  getMyConsultations,
  assignConsultation,
  declineConsultation,
  completeConsultation,
  getMessages,
  sendMessage,
  getPrescriptions,
  createPrescription,
} from "../../../services/endpoints";
import {
  getCachedConsultations,
  setCachedConsultations,
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
} from "../../../services/chatStore";
import { connectSocket, joinConsultation, getSocket } from "../../../services/socket";
import { MessageBubble } from "../MessageBubble";
import VetPatientProfile from "./VetPatientProfile";
import CallButton from "../../call/CallButton";
import { formatSex } from "../../../utils/sex";
import type { Consultation, Message, Prescription } from "../../../types";

type Tab = "offers" | "waiting" | "active";

const INITIAL_LOAD = 50;
const POLL_INTERVAL = 10000;

const FREQ_OPTIONS = ["Una vez al día", "Cada 12 hs", "Cada 8 hs", "Cada 6 hs"];
const DURATION_OPTIONS = ["3", "5", "7", "10", "15", "30"];

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

function PrescriptionCard({ rx }: { rx: Prescription }) {
  const hasDetails = rx.medication || rx.dosage || rx.frequency || rx.durationDays || rx.indications;
  return (
    <div className="mb-2 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Pill className="h-4 w-4 text-teal-700" />
        <span className="text-xs font-bold uppercase tracking-wide text-teal-800">Receta</span>
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

export default function VetMessagesSection() {
  // Hidratación instantánea desde la caché: los inicializadores lazy corren
  // en el primer render, así al volver a esta sección no hay spinner ni
  // recarga — la conversación y la lista ya están en memoria.
  const [consultations, setConsultations] = useState<Consultation[]>(() => getCachedConsultations() ?? []);
  const [activeCons, setActiveCons] = useState<Consultation | null>(() => {
    const cached = getCachedConsultations();
    if (!cached) return null;
    const lastId = getLastConsultationId();
    return lastId ? cached.find((c) => c.id === lastId) ?? null : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    const cached = getCachedConsultations();
    if (!cached) return "active";
    const hasPending = cached.some((c) => c.status === "PENDING");
    const hasActive = cached.some((c) => c.status === "ACTIVE");
    return !hasActive && hasPending ? "offers" : "active";
  });
  const [loadingCons, setLoadingCons] = useState(() => (getCachedConsultations() ? false : true));
  const [isSending, setIsSending] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [showList, setShowList] = useState(() => {
    const cached = getCachedConsultations();
    return !(cached && getLastConsultationId() && cached.some((c) => c.id === getLastConsultationId()));
  });
  const [closing, setClosing] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [rxContent, setRxContent] = useState("");
  const [rxMedication, setRxMedication] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxFrequency, setRxFrequency] = useState("");
  const [rxDuration, setRxDuration] = useState("");
  const [rxIndications, setRxIndications] = useState("");
  const [sendingPrescription, setSendingPrescription] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeConsRef = useRef<Consultation | null>(null);

  useEffect(() => {
    activeConsRef.current = activeCons;
  });

  const [showPatientProfile, setShowPatientProfile] = useState(false);

  const tabTouchedRef = useRef(false);
  const tabRef = useRef<Tab>("active");
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const fetchConsultations = useCallback(async () => {
    try {
      const data = await getMyConsultations();
      setCachedConsultations(data);
      setConsultations(data);
      // Si hay ofertas y ninguna consulta activa, mostrá la pestaña de
      // ofertas (solo hasta que el vet cambie de pestaña manualmente).
      if (
        !tabTouchedRef.current &&
        tabRef.current === "active" &&
        data.some((c) => c.status === "PENDING") &&
        !data.some((c) => c.status === "ACTIVE")
      ) {
        setTab("offers");
      }
    } catch { /* fallback handled */ }
    setLoadingCons(false);
  }, []);

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

  useEffect(() => {
    if (!activeCons) return;
    setCachedMessages(activeCons.id, messages);
  }, [messages, activeCons]);

  useEffect(() => {
    if (!activeCons) return;
    setCachedPrescriptions(activeCons.id, prescriptions);
  }, [prescriptions, activeCons]);

  // Socket global: mensajes, consultas, notificaciones.
  useEffect(() => {
    let cancelled = false;
    let s: Awaited<ReturnType<typeof connectSocket>> | null = null;
    const attach = (socket) => {
      if (cancelled) return;
      s = socket;
      setSocketConnected(socket.connected);
      const onConnect = () => {
        setSocketConnected(true);
        const active = activeConsRef.current;
        if (active) joinConsultation(active.id);
        fetchConsultations();
        if (active) {
          fetchMsgs(active.id);
          fetchPrescriptions(active.id);
        }
      };
      const onDisconnect = () => setSocketConnected(false);
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("message:new", (msg: Message) => {
        const active = activeConsRef.current;
        if (active && msg.consultationId === active.id) {
          applyMessageEcho(active.id, msg);
          setMessages(getCachedMessages(active.id) ?? []);
          // El mensaje ya llegó (echo del socket): el botón deja de
          // mostrar "enviando" aunque el POST REST todavía no responda.
          setIsSending(false);
        }
      });
      socket.on("consultation:updated", (updated: Consultation) => {
        updateCachedConsultation(updated);
        setConsultations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        const active = activeConsRef.current;
        if (active?.id === updated.id) setActiveCons(updated);
      });
      socket.on("consultation:new", () => fetchConsultations());
      socket.on("prescription:new", (prescription: Prescription) => {
        const active = activeConsRef.current;
        if (active && prescription.consultationId === active.id) {
          upsertPrescription(active.id, prescription);
          setPrescriptions(getCachedPrescriptions(active.id) ?? []);
        }
      });
      socket.on("notification:new", () => fetchConsultations());
    };
    // Si el handshake inicial rechaza (timeout), los listeners no se registrarían
    // y la pantalla quedaría ciega. Nos suscribimos igual al singleton: cuando
    // el socket reconecta, el handler 'connect' vuelve a unir la sala y refresca.
    connectSocket().then(attach).catch(() => {
      const sock = getSocket();
      if (sock) attach(sock);
    });
    return () => {
      cancelled = true;
      if (s) {
        s.off("connect");
        s.off("disconnect");
        s.off("message:new");
        s.off("consultation:updated");
        s.off("consultation:new");
        s.off("prescription:new");
        s.off("notification:new");
      }
    };
  }, [fetchConsultations, fetchMsgs, fetchPrescriptions]);

  // Lista inicial: la caché ya la hidrató en el primer render; acá solo se
  // refresca en segundo plano. Sin polling mientras el socket está vivo.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch de datos al montar
    fetchConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch de datos al montar
  }, []);

  // Respaldo: solo con el socket caído.
  useEffect(() => {
    if (socketConnected) return;
    const interval = setInterval(() => {
      fetchConsultations();
      const active = activeConsRef.current;
      if (active) {
        fetchMsgs(active.id);
        setMessages(getCachedMessages(active.id) ?? []);
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [socketConnected, fetchConsultations, fetchMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const offersList = useMemo(
    () => consultations.filter((c) => c.status === "PENDING"),
    [consultations]
  );
  const waitingList = useMemo(
    () => consultations.filter((c) => c.status === "WAITING"),
    [consultations]
  );
  const activeList = useMemo(
    () => consultations.filter((c) => c.status === "ACTIVE"),
    [consultations]
  );
  const displayList = tab === "offers" ? offersList : tab === "waiting" ? waitingList : activeList;

  const messageList = useMemo(
    () => messages.slice(-INITIAL_LOAD),
    [messages]
  );

  const handleAccept = useCallback(async (id: string) => {
    setActionId(id);
    try {
      const updated = await assignConsultation(id);
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      updateCachedConsultation(updated);
      setActiveCons(updated);
      setLastConsultationId(id);
      setShowList(false);
      setTab("active");
    } catch {
      alert("Error al aceptar la consulta");
    } finally {
      setActionId(null);
    }
  }, []);

  const handleDecline = useCallback(async (id: string) => {
    setActionId(id);
    try {
      const updated = await declineConsultation(id);
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      updateCachedConsultation(updated);
      setActiveCons((prev) => (prev?.id === id ? null : prev));
    } catch {
      alert("Error al rechazar la consulta");
    } finally {
      setActionId(null);
    }
  }, []);

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || !activeCons) return;
    setIsSending(true);
    const optimisticId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (!textOverride) setInput("");
    const optimistic: Message = {
      id: optimisticId,
      consultationId: activeCons.id,
      senderId: "",
      content: text,
      createdAt: new Date().toISOString(),
      sender: { id: "", email: "", role: "VET" },
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

  const openPrescriptionModal = useCallback(() => {
    setRxContent("");
    setRxMedication("");
    setRxDosage("");
    setRxFrequency("");
    setRxDuration("");
    setRxIndications("");
    setShowPrescriptionModal(true);
  }, []);

  const handleSendPrescription = useCallback(async () => {
    if (!activeCons) return;
    const medication = rxMedication.trim();
    const content =
      rxContent.trim() ||
      [
        medication,
        rxDosage.trim() && `Dosis: ${rxDosage.trim()}`,
        rxFrequency && `Frecuencia: ${rxFrequency}`,
        rxDuration && `Duración: ${rxDuration} días`,
        rxIndications.trim() && `Indicaciones: ${rxIndications.trim()}`,
      ]
        .filter(Boolean)
        .join(". ") + ".";
    if (!medication && !content.trim()) return;
    setSendingPrescription(true);
    try {
      const prescription = await createPrescription(activeCons.id, {
        content,
        medication: medication || undefined,
        dosage: rxDosage.trim() || undefined,
        frequency: rxFrequency,
        durationDays: rxDuration || undefined,
        indications: rxIndications.trim() || undefined,
      });
      upsertPrescription(activeCons.id, prescription);
      setPrescriptions(getCachedPrescriptions(activeCons.id) ?? []);
      setShowPrescriptionModal(false);
    } catch {
      alert("Error al enviar la receta");
    } finally {
      setSendingPrescription(false);
    }
  }, [activeCons, rxContent, rxMedication, rxDosage, rxFrequency, rxDuration, rxIndications]);

  const activeName = activeCons
    ? `${activeCons.client?.firstName || activeCons.client?.email || "Cliente"} — ${activeCons.pet?.name || "Mascota"}`
    : "";

  const isOffer = activeCons?.status === "PENDING";
  const isWaiting = activeCons?.status === "WAITING";

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm md:h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <div
        className={`w-full shrink-0 border-r border-border md:w-80 ${showList ? "block" : "hidden md:block"}`}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Consultas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {offersList.length} ofertas · {waitingList.length} disponibles · {activeList.length} activas
          </p>
        </div>
        <div className="flex border-b border-border">
          <button
            onClick={() => { tabTouchedRef.current = true; setTab("active"); setActiveCons(null); }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              tab === "active"
                ? "border-b-2 border-teal-700 text-teal-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Activas ({activeList.length})
          </button>
          <button
            onClick={() => { tabTouchedRef.current = true; setTab("offers"); setActiveCons(null); }}
            className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              tab === "offers"
                ? "border-b-2 border-teal-700 text-teal-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Ofertas ({offersList.length})
            {offersList.length > 0 && tab !== "offers" && (
              <span className="absolute top-1.5 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {offersList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { tabTouchedRef.current = true; setTab("waiting"); setActiveCons(null); }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              tab === "waiting"
                ? "border-b-2 border-teal-700 text-teal-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Cola ({waitingList.length})
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
                  <p className="font-semibold text-slate-500">No hay consultas en la cola</p>
                  <p className="mt-1 text-xs text-center">Cuando un dueño solicite una consulta sin vet elegido, aparecerá aquí</p>
                </>
              ) : tab === "offers" ? (
                <>
                  <UserRound className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-500">No tenés ofertas pendientes</p>
                  <p className="mt-1 text-xs text-center">Los clientes que te elijan aparecerán acá para que decidas si los atendés</p>
                </>
              ) : (
                <>
                  <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-500">No tenés consultas activas</p>
                  <p className="mt-1 text-xs text-center">Las consultas que aceptes aparecerán acá</p>
                </>
              )}
            </div>
          )}
          {!loadingCons && displayList.map((c) => {
            const isSelected = activeCons?.id === c.id;
            return (
              <div key={c.id}>
                <button
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
                      <p className="truncate font-semibold text-ink text-sm">
                        {c.pet?.name || "Mascota"}
                      </p>
                      {c.pet?.sex ? (
                        <span className="shrink-0 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                          {String(c.pet.sex).toLowerCase() === "male" ? <Mars className="h-3 w-3 text-blue-600" /> : <Venus className="h-3 w-3 text-pink-600" />}
                          {formatSex(c.pet.sex)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatTimeAgo(c.createdAt)}
                        </span>
                      )}
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
                  {c.status === "PENDING" && (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 text-[11px] font-semibold text-sky-700">
                      <Clock className="h-3 w-3" /> Oferta
                    </span>
                  )}
                  {c.status === "WAITING" && (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-700">
                      <Clock className="h-3 w-3" /> Cola
                    </span>
                  )}
                  {c.status === "ACTIVE" && (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 text-[11px] font-semibold text-green-700">
                      <CheckCircle className="h-3 w-3" /> Activa
                    </span>
                  )}
                </button>
                {(tab === "offers" || tab === "waiting") && (
                  <div className="flex items-center gap-2 border-b border-border bg-slate-50/60 px-5 py-2.5">
                    {tab === "offers" && (
                      <>
                        <Button
                          size="sm"
                          fullWidth={false}
                          className="flex-1"
                          loading={actionId === c.id}
                          onClick={() => handleAccept(c.id)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          fullWidth={false}
                          className="flex-1 border border-red-200 text-red-600 hover:bg-red-50"
                          disabled={actionId === c.id}
                          onClick={() => handleDecline(c.id)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {tab === "waiting" && (
                      <Button
                        size="sm"
                        fullWidth={false}
                        className="flex-1"
                        loading={actionId === c.id}
                        onClick={() => handleAccept(c.id)}
                      >
                        Tomar consulta
                      </Button>
                    )}
                    <button
                      onClick={() => { setActiveCons(c); setShowPatientProfile(true); }}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      title="Ver ficha del paciente antes de decidir"
                    >
                      <FileText className="h-3 w-3" />
                      Ficha
                    </button>
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
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">
                    {activeCons.status === "ACTIVE"
                      ? "En consulta"
                      : activeCons.status === "PENDING"
                        ? "Oferta pendiente de tu decisión"
                        : "Disponible para tomar"}
                  </p>
                  {activeCons.pet?.sex && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {String(activeCons.pet.sex).toLowerCase() === "male" ? <Mars className="h-3 w-3 text-blue-600" /> : <Venus className="h-3 w-3 text-pink-600" />}
                      {formatSex(activeCons.pet.sex)}
                    </span>
                  )}
                </div>
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
                  title="Ver ficha y expediente del paciente"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ficha</span>
                </button>
              )}
              {(isOffer || isWaiting) && (
                <Button
                  size="sm"
                  fullWidth={false}
                  loading={actionId === activeCons.id}
                  onClick={() => handleAccept(activeCons.id)}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Aceptar
                </Button>
              )}
              {isOffer && (
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  className="border border-red-200 text-red-600 hover:bg-red-50"
                  disabled={actionId === activeCons.id}
                  onClick={() => handleDecline(activeCons.id)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazar
                </Button>
              )}
              {activeCons.status === "ACTIVE" && (
                <CallButton
                  consultationId={activeCons.id}
                  peerName={activeCons.client?.firstName || activeCons.client?.email || "el cliente"}
                />
              )}
              {activeCons.status === "ACTIVE" && (
                <button
                  onClick={openPrescriptionModal}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                  title="Enviar receta"
                >
                  <Pill className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Receta</span>
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

            {(isOffer || isWaiting) && (
              <div className="flex items-start gap-2.5 border-b border-sky-100 bg-sky-50/70 px-5 py-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <div>
                  <p className="text-xs font-bold text-sky-800">
                    {isOffer
                      ? "El cliente te eligió para esta consulta"
                      : "Consulta disponible en la cola"}
                  </p>
                  <p className="text-xs text-sky-700/80">
                    Revisá el motivo y la ficha del paciente antes de decidir. El chat se habilita al aceptar.
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-0.5">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
                {messageList.map((msg, idx) => {
                  const prev = idx > 0 ? messageList[idx - 1] : null;
                  const isVet = msg.sender?.role === "VET" || msg.sender?.role === "ADMIN";
                  const showSender = !isVet && (idx === 0 || messageList[idx - 1]?.sender?.id !== msg.sender?.id);
                  const isOptimistic = msg.id.startsWith("msg-");
                  const isFailed = isOptimistic && failedIds.has(msg.id);
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

            {/* Input */}
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
              (isOffer || isWaiting) && (
                <div className="border-t border-border bg-slate-50 px-5 py-3.5">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Clock className="h-4 w-4" />
                    Aceptá la consulta para habilitar el chat. Podés ver la ficha del paciente antes.
                  </p>
                </div>
              )
            )}
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
      {/* Prescription modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
              <Pill className="h-5 w-5 text-teal-700" />
              Enviar receta
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Receta para{" "}
              <span className="font-semibold text-ink">
                {activeCons?.pet?.name || "la mascota"}
              </span>
              . Completá los campos y el resumen se arma solo:
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Medicación *</label>
                <input
                  type="text"
                  value={rxMedication}
                  onChange={(e) => setRxMedication(e.target.value)}
                  placeholder="Ej: Amoxicilina 500mg"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Dosis</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    placeholder="Ej: 1 comprimido"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Frecuencia</label>
                  <select
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  >
                    <option value="">Seleccioná...</option>
                    {FREQ_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Duración (días)</label>
                  <select
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  >
                    <option value="">Seleccioná...</option>
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d} días</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Indicaciones</label>
                  <input
                    type="text"
                    value={rxIndications}
                    onChange={(e) => setRxIndications(e.target.value)}
                    placeholder="Ej: con el estómago lleno"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Instrucciones adicionales</label>
                <textarea
                  value={rxContent}
                  onChange={(e) => setRxContent(e.target.value)}
                  placeholder="Ej: Reposo, control en 5 días, volver si no mejora..."
                  rows={3}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth={false}
                onClick={() => setShowPrescriptionModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="md"
                fullWidth={false}
                loading={sendingPrescription}
                disabled={!rxMedication.trim() && !rxContent.trim()}
                onClick={handleSendPrescription}
              >
                Enviar receta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
