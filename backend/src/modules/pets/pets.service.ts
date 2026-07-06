import { prisma } from '../../shared/prisma';

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
  return prisma.pet.create({
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age,
      weight: data.weight,
      weightKg: data.weightKg,
      sex: data.sex as any,
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
      ...(data.sex !== undefined && { sex: data.sex as any }),
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
  return prisma.pet.update({
    where: { id },
    data: { deletedAt: new Date() },
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

export async function getPetVetCard(petId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
      consultations: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, reason: true, status: true, completedAt: true, createdAt: true },
      },
    },
  });
  if (!pet) return null;

  const totalConsultations = await prisma.consultation.count({ where: { petId } });
  const lastConsultation: { endedAt: Date | null } | null = await prisma.consultation.findFirst({
    where: { petId, status: 'COMPLETED' },
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

  return {
    pet,
    owner: pet.owner,
    stats: {
      totalConsultations,
      lastConsultationDate: lastConsultation?.endedAt?.toISOString() ?? null,
      ageYears,
      ageMonths,
    },
    recentConsultations: (pet.consultations as any[]).map((c: any) => ({
      id: c.id,
      reason: c.reason ?? 'Sin motivo',
      status: c.status,
      completedAt: c.completedAt?.toISOString() ?? null,
    })),
    allergies: pet.allergies ?? [],
    chronicConditions: pet.chronicConditions ?? [],
  };
}
