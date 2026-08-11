import type { Consultation, Message, Prescription } from "../types";

/**
 * Caché en memoria de mensajes y recetas por consulta.
 * Evita recargar el chat (y su flicker) al cambiar de sección o de
 * conversación dentro de la sesión: el estado vive acá y los componentes
 * solo se suscriben.
 */
const messagesCache = new Map<string, Message[]>();
const prescriptionsCache = new Map<string, Prescription[]>();
let consultationsCache: Consultation[] | null = null;
let lastConsultationId: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getCachedConsultations(): Consultation[] | undefined {
  return consultationsCache ?? undefined;
}

export function setCachedConsultations(consultations: Consultation[]) {
  consultationsCache = consultations;
  notify();
}

export function updateCachedConsultation(updated: Consultation) {
  if (!consultationsCache) return;
  consultationsCache = consultationsCache.map((c) =>
    c.id === updated.id ? updated : c
  );
  notify();
}

export function getLastConsultationId(): string | null {
  return lastConsultationId;
}

export function setLastConsultationId(id: string | null) {
  lastConsultationId = id;
}

export function getCachedMessages(consultationId: string): Message[] | undefined {
  return messagesCache.get(consultationId);
}

export function setCachedMessages(consultationId: string, messages: Message[]) {
  messagesCache.set(consultationId, messages);
  notify();
}

/** Inserta/actualiza un mensaje en la caché de una consulta (dedup por id). */
export function upsertMessage(consultationId: string, message: Message) {
  const prev = messagesCache.get(consultationId) ?? [];
  const next = prev.some((m) => m.id === message.id)
    ? prev.map((m) => (m.id === message.id ? message : m))
    : [...prev, message];
  messagesCache.set(consultationId, next);
  notify();
}

/**
 * Reemplaza el mensaje optimista (id "msg-…") por el confirmado del servidor.
 * Si el id optimista ya no existe (lo reemplazó el echo del socket), no toca nada.
 */
export function confirmMessage(consultationId: string, optimisticId: string, real: Message) {
  const prev = messagesCache.get(consultationId);
  if (!prev) return;
  const next = prev.map((m) => (m.id === optimisticId ? real : m));
  messagesCache.set(consultationId, next);
  notify();
}

/**
 * Aplica un "echo" del socket (message:new). Reemplaza TODOS los optimistas
 * pendientes con el mismo contenido y rol para no dejar ninguno clavado en
 * "enviando" ni duplicar el mensaje si el REST ya llegó antes.
 */
export function applyMessageEcho(consultationId: string, message: Message) {
  const prev = messagesCache.get(consultationId) ?? [];
  if (prev.some((m) => m.id === message.id)) return;
  const withoutOptimistic = prev.filter(
    (m) =>
      !(
        m.id.startsWith("msg-") &&
        m.content === message.content &&
        (m.attachmentUrl ?? null) === (message.attachmentUrl ?? null) &&
        (typeof m.sender?.role === "string"
          ? m.sender.role === message.sender?.role
          : true)
      )
  );
  messagesCache.set(consultationId, [...withoutOptimistic, message]);
  notify();
}

export function getCachedPrescriptions(consultationId: string): Prescription[] | undefined {
  return prescriptionsCache.get(consultationId);
}

export function setCachedPrescriptions(consultationId: string, prescriptions: Prescription[]) {
  prescriptionsCache.set(consultationId, prescriptions);
  notify();
}

export function upsertPrescription(consultationId: string, prescription: Prescription) {
  const prev = prescriptionsCache.get(consultationId) ?? [];
  const next = prev.some((p) => p.id === prescription.id)
    ? prev
    : [...prev, prescription];
  prescriptionsCache.set(consultationId, next);
  notify();
}

export function subscribeChatStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearChatStore() {
  messagesCache.clear();
  prescriptionsCache.clear();
  consultationsCache = null;
  lastConsultationId = null;
  notify();
}
