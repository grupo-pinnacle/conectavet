import { prisma } from '../../shared/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { getCached, setCache, clearCache } from '../../shared/cache';
import { Prisma } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['ACTIVE'],
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
} satisfies Prisma.ConsultationSelect;

const consultationWithMessages = {
  ...consultationSnapshot,
  messages: {
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: publicUser } },
  },
} satisfies Prisma.ConsultationSelect;

export async function findFirstAvailableVet(species?: string) {
  const cacheKey = species ? `vets:available:${species.toLowerCase()}` : 'vets:available';
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  const vet = await prisma.user.findFirst({
    where: { role: 'VET', isOnline: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, firstName: true, lastName: true, isOnline: true },
  });
  if (vet) setCache(cacheKey, vet, 30);
  return vet;
}

export async function createConsultation(data: {
  clientId: string;
  petId: string;
  notes?: string;
}) {
  const pet = await prisma.pet.findUnique({ where: { id: data.petId } });
  if (!pet) throw new NotFoundError('Mascota no encontrada');
  if (pet.ownerId !== data.clientId) {
    throw new ForbiddenError('La mascota no te pertenece');
  }

  const vet = await findFirstAvailableVet(pet.species);

  return prisma.consultation.create({
    data: {
      clientId: data.clientId,
      petId: data.petId,
      status: vet ? 'ACTIVE' : 'WAITING',
      vetId: vet?.id,
      startedAt: vet ? new Date() : undefined,
      notes: data.notes,
    },
    select: consultationSnapshot,
  });
}

export async function assignVet(consultationId: string, vetId: string) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });
  if (!consultation) throw new NotFoundError('Consulta no encontrada');
  if (!VALID_TRANSITIONS[consultation.status].includes('ACTIVE')) {
    throw new ConflictError(`No se puede asignar — la consulta está en estado ${consultation.status}`);
  }
  if (consultation.vetId) {
    throw new ConflictError('Esta consulta ya tiene un veterinario asignado');
  }
  return prisma.consultation.update({
    where: { id: consultationId },
    data: { vetId, status: 'ACTIVE', startedAt: new Date() },
    select: consultationSnapshot,
  });
}

/**
 * Cola de espera: asigna al primer veterinario que se ponga online
 * la consulta WAITING más antigua. El claim es atómico (WHERE status=WAITING)
 * para que dos vets online simultáneos nunca tomen la misma consulta.
 */
export async function assignNextPendingVet(vetId: string) {
  const pending = await prisma.consultation.findFirst({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
  });
  if (!pending) return null;

  const claimed = await prisma.consultation.updateMany({
    where: { id: pending.id, status: 'WAITING' },
    data: { vetId, status: 'ACTIVE', startedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  return prisma.consultation.findUnique({
    where: { id: pending.id },
    select: consultationSnapshot,
  });
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
      select: consultationSnapshot,
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
      select: consultationSnapshot,
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
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;
  const vets = await prisma.user.findMany({
    where: { role: 'VET', isOnline: true },
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
