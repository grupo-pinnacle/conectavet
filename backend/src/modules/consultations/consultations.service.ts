import { prisma } from '../../shared/prisma';
import { ConsultationStatus } from '@prisma/client';

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

export async function getConsultationsByUser(userId: string, role: string) {
  const where =
    role === 'VET'
      ? { OR: [{ vetId: userId }, { status: 'WAITING' as const }] }
      : { clientId: userId };
  return prisma.consultation.findMany({
    where,
    include: { pet: true, client: true, vet: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAvailableVets() {
  return prisma.user.findMany({
    where: { role: 'VET', isOnline: true },
    select: { id: true, email: true, isOnline: true },
  });
}

export async function saveMessage(data: {
  consultationId: string;
  senderId: string;
  content: string;
}) {
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
