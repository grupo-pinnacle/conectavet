import { prisma } from '../../shared/prisma.js';
import { ConflictError } from '../../shared/errors/index.js';
import { Sex } from '@prisma/client';

export async function getPetsByOwner(ownerId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.pet.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pet.count({ where: { ownerId, deletedAt: null } }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPetById(id: string) {
  return prisma.pet.findUnique({
    where: { id },
    include: { owner: { select: { id: true, email: true, role: true } } },
  });
}

export async function createPet(data: {
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  photoUrl?: string;
  ownerId: string;
  weightKg?: number;
  sex?: string;
  color?: string;
  microchip?: string;
  allergies?: string[];
  chronicConditions?: string[];
  birthDate?: string;
}) {
  const existing = await prisma.pet.findFirst({
    where: {
      ownerId: data.ownerId,
      name: { equals: data.name, mode: 'insensitive' },
      deletedAt: null
    }
  });
  if (existing) {
    throw new ConflictError('Ya tenés una mascota activa con este nombre');
  }

  return prisma.pet.create({
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age,
      weight: data.weight,
      weightKg: data.weightKg,
      sex: data.sex as Sex,
      color: data.color,
      microchip: data.microchip,
      allergies: data.allergies ?? [],
      chronicConditions: data.chronicConditions ?? [],
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      photoUrl: data.photoUrl ?? null,
      ownerId: data.ownerId,
    },
  });
}

export async function updatePet(
  id: string,
  data: {
    name?: string;
    species?: string;
    breed?: string;
    age?: number;
    weight?: number;
    photoUrl?: string;
    weightKg?: number;
    sex?: string;
    color?: string;
    microchip?: string;
    allergies?: string[];
    chronicConditions?: string[];
    birthDate?: string;
  },
) {
  return prisma.pet.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.species !== undefined && { species: data.species }),
      ...(data.breed !== undefined && { breed: data.breed }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
      ...(data.sex !== undefined && { sex: data.sex as Sex }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.microchip !== undefined && { microchip: data.microchip }),
      ...(data.allergies !== undefined && { allergies: data.allergies }),
      ...(data.chronicConditions !== undefined && { chronicConditions: data.chronicConditions }),
      ...(data.birthDate !== undefined && { birthDate: new Date(data.birthDate) }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
    },
  });
}

export async function deletePet(id: string) {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.pet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.consultation.updateMany({
      where: { petId: id, status: { in: ['WAITING', 'PENDING', 'ACTIVE'] } },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });

    return pet;
  });
}

export async function restorePet(id: string, userId: string) {
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet || pet.ownerId !== userId) return null;
  return prisma.pet.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function getManagedPets(vetId: string, page = 1, limit = 50) {
  const cappedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * cappedLimit;
  // Mascotas que el vet está atendiendo actualmente (PENDING o ACTIVE)
  const activeStatuses = ['PENDING', 'ACTIVE'] as Array<'PENDING' | 'ACTIVE'>;
  const where = { consultations: { some: { vetId, status: { in: activeStatuses }, pet: { is: { deletedAt: null } } } } };
  const [data, total] = await Promise.all([
    prisma.pet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: cappedLimit,
    }),
    prisma.pet.count({ where }),
  ]);
  return { data, total, page, limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) };
}

export async function vetHasConsultationForPet(vetId: string, petId: string) {
  const consultation = await prisma.consultation.findFirst({
    where: {
      vetId,
      petId,
      status: { in: ['PENDING', 'ACTIVE', 'COMPLETED'] },
      deletedAt: null,
    },
    select: { id: true },
  });
  return !!consultation;
}

export async function getPetVetCard(petId: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, deletedAt: null },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        },
      },
      consultations: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: {
            select: { prescriptions: true },
          },
        },
      },
    },
  });

  if (!pet) return null;

  const totalConsultations = await prisma.consultation.count({
    where: { petId, deletedAt: null },
  });

  const lastCompleted = await prisma.consultation.findFirst({
    where: { petId, status: 'COMPLETED', deletedAt: null },
    orderBy: { endedAt: 'desc' },
    select: { endedAt: true },
  });

  let ageYears = 0;
  let ageMonths = 0;
  if (pet.birthDate) {
    const now = new Date();
    const birth = new Date(pet.birthDate);
    ageYears = now.getFullYear() - birth.getFullYear();
    ageMonths = now.getMonth() - birth.getMonth();
    if (ageMonths < 0) { ageYears--; ageMonths += 12; }
  }

  const { owner, consultations, ...petData } = pet;

  return {
    pet: petData,
    owner,
    stats: {
      totalConsultations,
      lastConsultationDate: lastCompleted?.endedAt ? lastCompleted.endedAt.toISOString() : null,
      ageYears,
      ageMonths,
    },
    recentConsultations: consultations.map((c) => ({
      id: c.id,
      reason: c.notes ?? 'Sin motivo',
      status: c.status,
      completedAt: c.endedAt ? c.endedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      prescriptionCount: c._count?.prescriptions ?? 0,
    })),
    allergies: pet.allergies ?? [],
    chronicConditions: pet.chronicConditions ?? [],
  };
}
