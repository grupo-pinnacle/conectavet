import { prisma } from '../../shared/prisma';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { getCached, setCache, clearCache } from '../../shared/cache';

const VALID_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function createConsultation(data: {
  clientId: string;
  petId: string;
}) {
  return prisma.consultation.create({
    data: {
      clientId: data.clientId,
      petId: data.petId,
      status: 'WAITING',
    },
    include: { pet: true, client: true },
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

export async function getAvailableVets() {
  const cached = getCached<any[]>('vets:available');
  if (cached) return cached;
  const vets = await prisma.user.findMany({
    where: { role: 'VET', isOnline: true },
    select: { id: true, email: true, isOnline: true },
  });
  setCache('vets:available', vets, 30);
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
