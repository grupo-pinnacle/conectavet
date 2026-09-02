import { prisma } from '../../shared/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { getCached, setCache, clearCache } from '../../shared/cache';
import { Prisma } from '@prisma/client';
import { checkRateLimit, isDuplicate } from './message-throttle';

// const VALID_TRANSITIONS: Record<string, string[]> = {
//   WAITING: ['PENDING', 'ACTIVE'],
//   PENDING: ['ACTIVE', 'WAITING'],
//   ACTIVE: ['COMPLETED'],
//   COMPLETED: [],
//   CANCELLED: [],
// };

/**
 * Snapshot pÃºblico de usuario: nunca expone el hash de password.
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
 * Snapshot pÃºblico de consulta (solo columnas necesarias, sin password).
 */
const consultationSnapshot = {
  id: true,
  clientId: true,
  vetId: true,
  petId: true,
  status: true,
  notes: true,
  diagnosisNotes: true,
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

export async function findFirstAvailableVet(species?: string) {
  // Matching por carga (Fairness): en vez de saturar al vet más antiguo,
  // seleccionamos los veterinarios online APPROVED y elegimos el que tenga
  // MENOR cantidad de consultas activas o pendientes.
  const where: Prisma.UserWhereInput = {
    role: 'VET',
    isOnline: true,
    vetStatus: 'APPROVED',
    ...(species
      ? {
          consultationsAsVet: { some: { pet: { species } } },
        }
      : {}),
  };

  const candidates = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isOnline: true,
      consultationsAsVet: {
        where: { status: { in: ['ACTIVE', 'PENDING'] }, deletedAt: null },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });

  if (candidates.length === 0 && species) {
    return findFirstAvailableVet();
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.consultationsAsVet.length - b.consultationsAsVet.length);

  const best = candidates[0];
  return {
    id: best.id,
    email: best.email,
    firstName: best.firstName,
    lastName: best.lastName,
    isOnline: best.isOnline,
  };
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

  const existingActive = await prisma.consultation.findFirst({
    where: {
      petId: data.petId,
      status: { in: ['WAITING', 'PENDING', 'ACTIVE'] },
      deletedAt: null,
    }
  });
  if (existingActive) {
    throw new ConflictError('Ya tenÃ©s una consulta activa o en espera para esta mascota');
  }

  // La consulta nunca nace ACTIVA: el veterinario siempre decide si atender.
  //  - Si el cliente eligiÃ³ un vet puntual: nace como oferta (PENDING) para Ã©l,
  //    aunque estÃ© offline la verÃ¡ y decidirÃ¡ al entrar a la web.
  //  - Si no eligiÃ³: se ofrece al primer vet online (PENDING) o queda WAITING
  //    para el primer vet que se conecte / para tomar de la cola pÃºblica.
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
  const vet = await prisma.user.findUnique({
    where: { id: vetId },
    select: { role: true, vetStatus: true },
  });
  if (!vet || vet.role !== 'VET' || vet.vetStatus !== 'APPROVED') {
    throw new ForbiddenError('Solo veterinarios aprobados pueden atender consultas');
  }

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
  const vet = await prisma.user.findUnique({
    where: { id: vetId },
    select: { role: true, vetStatus: true },
  });
  if (!vet || vet.role !== 'VET' || vet.vetStatus !== 'APPROVED') {
    return null;
  }

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

export async function cancelConsultation(id: string, userId: string) {
  const consultation = await getConsultationById(id);
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== userId) throw new ForbiddenError('No puedes cancelar esta consulta');
  
  if (consultation.status !== 'WAITING' && consultation.status !== 'PENDING') {
    throw new ConflictError('Solo puedes cancelar consultas en espera o pendientes');
  }

  return prisma.consultation.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      pet: { select: { id: true, name: true, species: true, breed: true, photoUrl: true } },
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      vet: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
}

export async function completeConsultation(
  consultationId: string,
  notes?: string
) {
  // Actualización atómica: cerramos la consulta SÓLO si está ACTIVE.
  // Guardamos las notas del diagnóstico en diagnosisNotes preservando el motivo original en notes.
  const result = await prisma.consultation.updateMany({
    where: { id: consultationId, status: 'ACTIVE' },
    data: {
      status: 'COMPLETED',
      ...(notes !== undefined ? { diagnosisNotes: notes } : {}),
      endedAt: new Date(),
    },
  });
  if (result.count === 0) {
    const current = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { status: true },
    });
    if (!current) throw new NotFoundError('Consulta no encontrada');
    throw new ConflictError(`No se puede cerrar — la consulta está en estado ${current.status}`);
  }
  return prisma.consultation.findUniqueOrThrow({
    where: { id: consultationId },
    select: consultationSnapshot,
  });
}

export async function getConsultationById(id: string) {
  return prisma.consultation.findFirst({
    where: { id, deletedAt: null },
    select: consultationWithMessages,
  });
}

export async function getConsultationSnapshotById(id: string) {
  return prisma.consultation.findFirst({
    where: { id, deletedAt: null },
    select: consultationSnapshot,
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
      ? { OR: [{ vetId: userId }, { status: 'WAITING' as const }], deletedAt: null }
      : { clientId: userId, deletedAt: null };
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
  opts: { page?: number; limit?: number; cursor?: string } = {}
) {
  const cappedLimit = Math.min(opts.limit ?? 50, MAX_PAGE_SIZE);
  const where = role === 'VET' ? { vetId: userId, deletedAt: null } : { clientId: userId, deletedAt: null };

  // A-03 (cursor): paginaciÃ³n keyset O(log n) para listas grandes. Si llega
  // `cursor` (id_ts), usamos bÃºsqueda por (createdAt, id) y devolvemos
  // `nextCursor`. Sin `cursor` se mantiene la paginaciÃ³n por offset (compat
  // con web/mobile que hoy usan page/limit).
  if (opts.cursor) {
    const [cursorId, cursorTsRaw] = opts.cursor.split('_');
    const cursorCreatedAt = new Date(Number(cursorTsRaw));
    const keysetWhere =
      !isNaN(cursorCreatedAt.getTime()) ?
        {
          ...where,
          OR: [
            { createdAt: { lt: cursorCreatedAt } },
            { createdAt: { equals: cursorCreatedAt }, id: { lt: cursorId } },
          ],
        }
      : where;
    const rows = await prisma.consultation.findMany({
      where: keysetWhere,
      select: { ...consultationSnapshot, prescriptions: true },
      orderBy: { createdAt: 'desc' },
      take: cappedLimit + 1,
    });
    const hasMore = rows.length > cappedLimit;
    const data = hasMore ? rows.slice(0, cappedLimit) : rows;
    const last = data[data.length - 1];
    return {
      data,
      total: data.length,
      page: 1,
      limit: cappedLimit,
      totalPages: 1,
      nextCursor: hasMore && last ? `${last.id}_${last.createdAt.getTime()}` : null,
    };
  }

  const page = opts.page ?? 1;
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
  const cached = await getCached<VetPublic[]>(cacheKey);
  if (cached) return cached;
  const where: Prisma.UserWhereInput = {
    role: 'VET',
    isOnline: true,
    vetStatus: 'APPROVED',
    ...(species
      ? { consultationsAsVet: { some: { pet: { species } } } }
      : {}),
  };
  const vets = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, isOnline: true },
    orderBy: { createdAt: 'asc' },
  });
  await setCache(cacheKey, vets, 30);
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
    throw new ConflictError('El mensaje no puede estar vacÃ­o');
  }
  if (data.content && data.content.length > 2000) {
    throw new ConflictError('El mensaje no puede superar los 2000 caracteres');
  }
  if (
    hasAttachment &&
    !data.attachmentUrl!.startsWith('/uploads/') &&
    !data.attachmentUrl!.startsWith('https://')
  ) {
    throw new ConflictError('La imagen adjunta es invÃ¡lida');
  }
  return prisma.message.create({
    data: {
      consultationId: data.consultationId,
      senderId: data.senderId,
      content: hasContent ? data.content!.trim() : '',
      attachmentUrl: hasAttachment ? data.attachmentUrl : null,
      clientMsgId: data.clientMsgId ?? null,
    },
    include: { sender: { select: { id: true, email: true, role: true } } },
  });
}

/**
 * EnvÃ­o de mensaje UNIFICADO para REST y Socket.io: valida participaciÃ³n,
 * estado ACTIVE, aplica rate-limit compartido y dedup durable por clientMsgId.
 * Los llamadores (controller/gateway) se encargan de emitir por socket y
 * notificar; asÃ­ no hay dos caminos de validaciÃ³n que diverjan.
 */
export async function sendConsultationMessage(params: {
  userId: string;
  consultationId: string;
  content?: string;
  attachmentUrl?: string;
  clientMsgId?: string;
}) {
  const { userId, consultationId, content, attachmentUrl, clientMsgId } = params;
  const consultation = await getConsultationById(consultationId);
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (consultation.clientId !== userId && consultation.vetId !== userId) {
    throw new ForbiddenError('No participÃ¡s de esta consulta');
  }
  if (consultation.status !== 'ACTIVE') {
    throw new ConflictError('La consulta no estÃ¡ activa. No podÃ©s enviar mensajes.');
  }
  if (!(await checkRateLimit(`msg:${userId}`))) {
    throw new ConflictError('Demasiados mensajes. EsperÃ¡ un momento.');
  }
  // Dedup durable por clientMsgId usando Redis (previene double-submission race conditions)
  if (clientMsgId) {
    const dup = await isDuplicate(consultationId, clientMsgId);
    if (dup) {
      // Si es un duplicado en vuelo (estÃ¡ en Redis), buscamos si ya se guardÃ³ en DB
      const existing = await prisma.message.findFirst({
        where: { consultationId, clientMsgId },
        include: { sender: { select: { id: true, email: true, role: true } } },
      });
      if (existing) return { message: existing, duplicated: true };
      throw new ConflictError('Mensaje en proceso. Por favor esperÃ¡.');
    }
  }
  const message = await saveMessage({
    consultationId,
    senderId: userId,
    content,
    attachmentUrl,
    clientMsgId,
  });
  return { message };
}

const MAX_MESSAGES = 500;

export async function getMessages(consultationId: string, page = 1, limit = MAX_MESSAGES) {
  const cappedLimit = Math.min(Math.max(1, limit), MAX_MESSAGES);
  const skip = (page - 1) * cappedLimit;
  return prisma.message.findMany({
    where: { consultationId, deletedAt: null },
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
    throw new ConflictError('La receta no puede estar vacÃ­a');
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
  // servicio no debe confiar en el caller. Rating entero 1â€“5 y comentario
  // obligatorio (mÃ­nimo 10 caracteres).
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new ConflictError('La calificaciÃ³n debe ser un entero del 1 al 5');
  }
  if (!data.comment || data.comment.trim().length < 10) {
    throw new ConflictError('El comentario es obligatorio (mÃ­nimo 10 caracteres)');
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

  // Carrera (TOCTOU): dos requests pueden pasar la verificación de "ya
  // calificada" a la vez. Si llegan concurrentes, el unique en consultationId
  // lanza P2002. En vez de un 500 genérico, devolvemos 409 claro (ConflictError).
  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          rating: data.rating,
          comment: data.comment,
          consultationId: data.consultationId,
          clientId: data.clientId,
          vetId: consultation.vetId!,
        },
      });

      const aggregate = await tx.review.aggregate({
        where: { vetId: consultation.vetId! },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const ratingAvg = Math.round((aggregate._avg.rating ?? 0) * 10) / 10;
      const ratingCount = aggregate._count.rating ?? 0;

      await tx.user.update({
        where: { id: consultation.vetId! },
        data: { ratingAvg, ratingCount },
      });

      return created;
    });

    await clearCache('vets:list:');
    return review;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Esta consulta ya fue calificada');
    }
    throw error;
  }
}

