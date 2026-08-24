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

export async function getManagedPets(vetId: string) {
  const consultations = await prisma.consultation.findMany({
    where: { vetId, pet: { deletedAt: null } },
    select: { pet: true },
    distinct: ['petId'],
    orderBy: { updatedAt: 'desc' },
  });
  return consultations.map((c) => c.pet);
}

export async function getPetVetCard(petId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      pet: any;
      owner: any;
      totalConsultations: bigint | number;
      lastConsultationDate: Date | null;
      recent: any;
    }>
  >`
    SELECT
      to_jsonb(p) AS pet,
      to_jsonb(jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'firstName', u."firstName",
        'lastName', u."lastName",
        'phone', u.phone,
        'role', u.role
      )) AS owner,
      (SELECT COUNT(*) FROM consultations WHERE "petId" = ${petId}) AS "totalConsultations",
      (SELECT "endedAt" FROM consultations
       WHERE "petId" = ${petId} AND status = 'COMPLETED'
       ORDER BY "endedAt" DESC LIMIT 1) AS "lastConsultationDate",
      COALESCE(
        (SELECT jsonb_agg(sub ORDER BY sub."createdAt" DESC)
         FROM (
           SELECT "id", "notes", "status", "endedAt", "createdAt"
           FROM consultations
           WHERE "petId" = ${petId}
           ORDER BY "createdAt" DESC
           LIMIT 5
         ) sub),
        '[]'::jsonb
      ) AS recent
    FROM pets p
    JOIN users u ON u.id = p."ownerId"
    WHERE p.id = ${petId} AND p."deletedAt" IS NULL
  `;
  const row = rows[0];
  if (!row || !row.pet) return null;
  const pet = row.pet;
  const recent = Array.isArray(row.recent) ? row.recent : [];

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
    owner: row.owner,
    stats: {
      totalConsultations: Number(row.totalConsultations),
      lastConsultationDate: row.lastConsultationDate
        ? new Date(row.lastConsultationDate).toISOString()
        : null,
      ageYears,
      ageMonths,
    },
    recentConsultations: recent.map((c: any) => ({
      id: c.id,
      reason: c.notes ?? 'Sin motivo',
      status: c.status,
      completedAt: c.endedAt ? new Date(c.endedAt).toISOString() : null,
    })),
    allergies: pet.allergies ?? [],
    chronicConditions: pet.chronicConditions ?? [],
  };
}
