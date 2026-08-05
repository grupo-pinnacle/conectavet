import { prisma } from '../../shared/prisma';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { getCached, setCache, clearCache } from '../../shared/cache';

const VALID_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

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
    include: { pet: true, client: true, vet: true },
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
    include: { pet: true, client: true, vet: true },
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
    include: { pet: true, client: true, vet: true },
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
    include: { pet: true, client: true, vet: true, messages: true },
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
      include: { pet: true, client: true, vet: true },
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
  content: string;
}) {
  if (!data.content || data.content.trim().length === 0) {
    throw new ConflictError('El mensaje no puede estar vacío');
  }
  if (data.content.length > 2000) {
    throw new ConflictError('El mensaje no puede superar los 2000 caracteres');
  }
  return prisma.message.create({
    data: {
      consultationId: data.consultationId,
      senderId: data.senderId,
      content: data.content,
    },
    include: { sender: { select: { id: true, email: true, role: true } } },
  });
}

export async function getMessages(consultationId: string) {
  return prisma.message.findMany({
    where: { consultationId },
    include: { sender: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: 'asc' },
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
