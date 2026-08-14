import { prisma } from '../../shared/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { getCached, setCache, clearCache } from '../../shared/cache';
import { Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['PENDING', 'ACTIVE'],
  PENDING: ['ACTIVE', 'WAITING'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Snapshot público de usuario: nunca expone el hash de password.
 * Usado en todos los selects de consulta (client/vet/sender).
 */
const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isOnline: true,
} as const;

/**
 * Snapshot público de consulta (solo columnas necesarias, sin password).
 */
const consultationSnapshot = {
  id: true,
  clientId: true,
  vetId: true,
  petId: true,
  status: true,
  notes: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true,
  pet: true,
  client: { select: publicUser },
  vet: { select: publicUser },
  review: { select: { id: true, rating: true, comment: true } },
} satisfies Prisma.ConsultationSelect;

const consultationWithMessages = {
  ...consultationSnapshot,
  messages: {
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: publicUser } },
  },
} satisfies Prisma.ConsultationSelect;

const vetPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isOnline: true,
} as const;

export async function findFirstAvailableVet(species?: string) {
  // Sin caché: el pick se consume una sola vez (se asigna a una consulta).
  // Cachearlo 30s re-servía el MISMO vet a todos los clients en esa ventana
  // (sobrecarga del vet) y podía devolver un vet recién puesto offline.
  // Si hay una especie, se priorizan los vets que ya atendieron mascotas de
  // esa especie; si ninguno tiene historial, se cae a cualquier vet online.
  if (species) {
    const experienced = await prisma.user.findFirst({
      where: {
        role: 'VET',
        isOnline: true,
        consultationsAsVet: { some: { pet: { species } } },
      },
      orderBy: { createdAt: 'asc' },
      select: vetPublicSelect,
    });
    if (experienced) return experienced;
  }
  return prisma.user.findFirst({
    where: { role: 'VET', isOnline: true },
    orderBy: { createdAt: 'asc' },
    select: vetPublicSelect,
  });
}

export async function createConsultation(data: {
  clientId: string;
  petId: string;
  notes?: string;
  vetId?: string;
}) {
  const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
  if (!pet) throw new NotFoundError('Mascota no encontrada');
  if (pet.ownerId !== data.clientId) {
    throw new ForbiddenError('La mascota no te pertenece');
  }

  // La consulta nunca nace ACTIVA: el veterinario siempre decide si atender.
  //  - Si el cliente eligió un vet puntual: nace como oferta (PENDING) para él,
  //    aunque esté offline la verá y decidirá al entrar a la web.
  //  - Si no eligió: se ofrece al primer vet online (PENDING) o queda WAITING
  //    para el primer vet que se conecte / para tomar de la cola pública.
  let vetId: string | undefined;
  let status: 'PENDING' | 'WAITING' = 'WAITING';

  if (data.vetId) {
    const chosen = await prisma.user.findUnique({ where: { id: data.vetId } });
    if (!chosen || chosen.role !== 'VET') {
      throw new NotFoundError('Veterinario no encontrado');
    }
    vetId = chosen.id;
    status = 'PENDING';
  } else {
    const vet = await findFirstAvailableVet(pet.species);
    vetId = vet?.id;
    status = vet ? 'PENDING' : 'WAITING';
  }

  return prisma.consultation.create({
    data: {
      clientId: data.clientId,
      petId: data.petId,
      status,
      vetId,
      notes: data.notes,
    },
    select: consultationSnapshot,
  });
}

export async function assignVet(consultationId: string, vetId: string) {
  // Claim atómico (WHERE status) para evitar la carrera TOCTOU: dos vets
  // no pueden "tomar" la misma consulta WAITING al mismo tiempo. La oferta
  // PENDING sólo la reclama el vet al que fue ofrecida.
  const claimed = await prisma.consultation.updateMany({
    where: {
      id: consultationId,
      OR: [
        { status: 'WAITING' },
        { status: 'PENDING', vetId },
      ],
    },
    data: { vetId, status: 'ACTIVE', startedAt: new Date() },
  });

  if (claimed.count === 0) {
    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!consultation) throw new NotFoundError('Consulta no encontrada');
    if (consultation.status === 'PENDING' && consultation.vetId !== vetId) {
      throw new ConflictError('Esta oferta es de otro veterinario');
    }
    throw new ConflictError(`No se puede tomar — la consulta está en estado ${consultation.status}`);
  }

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: consultationSnapshot,
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  return consultation;
}

/**
 * Rechazo de una oferta PENDING: la consulta vuelve a la cola pública (WAITING)
 * sin vet asignado para que otro veterinario pueda tomarla u ofrecérsela.
 */
export async function declineConsultation(consultationId: string, vetId: string) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.status !== 'PENDING') {
    throw new ConflictError('La consulta no está en estado de aprobación');
  }
  if (consultation.vetId && consultation.vetId !== vetId) {
    throw new ConflictError('Esta oferta es de otro veterinario');
  }
  return prisma.consultation.update({
    where: { id: consultationId },
    data: { status: 'WAITING', vetId: null },
    select: consultationSnapshot,
  });
}

/**
 * Cola de espera: asigna al primer veterinario que se ponga online
 * la consulta WAITING más antigua como OFERTA (PENDING) — él decide aceptarla,
 * nunca arranca sola. El claim es atómico (WHERE status=WAITING) para que dos
 * vets online simultáneos nunca tomen la misma consulta.
 */
export async function assignNextPendingVet(vetId: string) {
  // Reintenta el claim atómico: si dos vets online compiten por la misma
  // consulta, el perdedor salta a la siguiente WAITING en vez de quedarse sin
  // asignar hasta su próximo toggle de disponibilidad.
  for (let attempt = 0; attempt < 5; attempt++) {
    const pending = await prisma.consultation.findFirst({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });
    if (!pending) return null;

    const claimed = await prisma.consultation.updateMany({
      where: { id: pending.id, status: 'WAITING' },
      data: { vetId, status: 'PENDING' },
    });
    if (claimed.count === 1) {
      return prisma.consultation.findUnique({
        where: { id: pending.id },
        select: consultationSnapshot,
      });
    }
  }
  return null;
}

export async function completeConsultation(
  consultationId: string,
  notes?: string
) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (!VALID_TRANSITIONS[consultation.status].includes('COMPLETED')) {
    throw new ConflictError(`No se puede cerrar — la consulta está en estado ${consultation.status}`);
  }
  return prisma.consultation.update({
    where: { id: consultationId },
    data: { status: 'COMPLETED', notes, endedAt: new Date() },
  });
}

export async function getConsultationById(id: string) {
  return prisma.consultation.findUnique({
    where: { id },
    select: consultationWithMessages,
  });
}

const MAX_PAGE_SIZE = 100;

export async function getConsultationsByUser(
  userId: string,
  role: string,
  page = 1,
  limit = 50
) {
  const cappedLimit = Math.min(limit, MAX_PAGE_SIZE);
  const where =
    role === 'VET'
      ? { OR: [{ vetId: userId }, { status: 'WAITING' as const }] }
      : { clientId: userId };
  const skip = (page - 1) * cappedLimit;
  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      select: { ...consultationSnapshot, prescriptions: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: cappedLimit,
    }),
    prisma.consultation.count({ where }),
  ]);
  return { data, total, page, limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) };
}

/**
 * Historial de consultas. Para VET solo las que le fueron asignadas
 * (nunca la cola global WAITING de otros clientes, a diferencia de /mine).
 */
export async function getConsultationHistory(
  userId: string,
  role: string,
  page = 1,
  limit = 50
) {
  const cappedLimit = Math.min(limit, MAX_PAGE_SIZE);
  const where = role === 'VET' ? { vetId: userId } : { clientId: userId };
  const skip = (page - 1) * cappedLimit;
  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      select: { ...consultationSnapshot, prescriptions: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: cappedLimit,
    }),
    prisma.consultation.count({ where }),
  ]);
  return { data, total, page, limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) };
}

export async function getAvailableVets(species?: string) {
  const cacheKey = species
    ? `vets:list:available:${species.toLowerCase()}`
    : 'vets:list:available';
  type VetPublic = { id: string; email: string; firstName: string; lastName: string; isOnline: boolean };
  const cached = getCached<VetPublic[]>(cacheKey);
  if (cached) return cached;
  const where: Prisma.UserWhereInput = {
    role: 'VET',
    isOnline: true,
    ...(species
      ? { consultationsAsVet: { some: { pet: { species } } } }
      : {}),
  };
  const vets = await prisma.user.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true, isOnline: true },
    orderBy: { createdAt: 'asc' },
  });
  setCache(cacheKey, vets, 30);
  return vets;
}

export async function saveMessage(data: {
  consultationId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string;
  clientMsgId?: string;
}) {
  const hasContent = !!data.content && data.content.trim().length > 0;
  const hasAttachment = !!data.attachmentUrl;
  if (!hasContent && !hasAttachment) {
    throw new ConflictError('El mensaje no puede estar vacío');
  }
  if (data.content && data.content.length > 2000) {
    throw new ConflictError('El mensaje no puede superar los 2000 caracteres');
  }
  if (hasAttachment && !data.attachmentUrl!.startsWith('/uploads/')) {
    throw new ConflictError('La imagen adjunta es inválida');
  }
  return prisma.message.create({
    data: {
      consultationId: data.consultationId,
      senderId: data.senderId,
      content: hasContent ? data.content!.trim() : '',
      attachmentUrl: hasAttachment ? data.attachmentUrl : null,
    },
    include: { sender: { select: { id: true, email: true, role: true } } },
  });
}

const MAX_MESSAGES = 500;

export async function getMessages(consultationId: string, page = 1, limit = MAX_MESSAGES) {
  const cappedLimit = Math.min(Math.max(1, limit), MAX_MESSAGES);
  const skip = (page - 1) * cappedLimit;
  return prisma.message.findMany({
    where: { consultationId },
    include: { sender: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: 'asc' },
    skip,
    take: cappedLimit,
  });
}

export async function savePrescription(data: {
  consultationId: string;
  vetId: string;
  content: string;
  medication?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: string;
  indications?: string;
}) {
  if (!data.content || data.content.trim().length === 0) {
    throw new ConflictError('La receta no puede estar vacía');
  }
  if (data.content.length > 5000) {
    throw new ConflictError('La receta no puede superar los 5000 caracteres');
  }
  return prisma.prescription.create({
    data: {
      consultationId: data.consultationId,
      vetId: data.vetId,
      content: data.content,
      medication: data.medication?.trim() || null,
      dosage: data.dosage?.trim() || null,
      frequency: data.frequency?.trim() || null,
      durationDays: data.durationDays?.trim() || null,
      indications: data.indications?.trim() || null,
    },
    include: {
      vet: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getPrescriptions(consultationId: string) {
  return prisma.prescription.findMany({
    where: { consultationId },
    include: {
      vet: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createReview(data: {
  consultationId: string;
  clientId: string;
  rating: number;
  comment?: string;
}) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: data.consultationId },
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== data.clientId) {
    throw new ForbiddenError('Solo el cliente de la consulta puede calificarla');
  }
  // Defensa en profundidad: el controller ya valida con Zod, pero el
  // servicio no debe confiar en el caller. Rating entero 1–10 y comentario
  // obligatorio (mínimo 10 caracteres).
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 10) {
    throw new ConflictError('La calificación debe ser un entero del 1 al 10');
  }
  if (!data.comment || data.comment.trim().length < 10) {
    throw new ConflictError('El comentario es obligatorio (mínimo 10 caracteres)');
  }
  if (consultation.status !== 'COMPLETED') {
    throw new ConflictError('Solo se pueden calificar consultas finalizadas');
  }
  if (!consultation.vetId) {
    throw new ConflictError('Esta consulta no tiene veterinario asignado');
  }

  const existing = await prisma.review.findUnique({
    where: { consultationId: data.consultationId },
  });
  if (existing) {
    throw new ConflictError('Esta consulta ya fue calificada');
  }

  return prisma.review.create({
    data: {
      rating: data.rating,
      comment: data.comment,
      consultationId: data.consultationId,
      clientId: data.clientId,
      vetId: consultation.vetId,
    },
  });
}
