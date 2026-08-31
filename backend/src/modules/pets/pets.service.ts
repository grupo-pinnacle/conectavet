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
    where: { vetId, petId, status: { in: ['PENDING', 'ACTIVE'] as Array<'PENDING' | 'ACTIVE'> }, deletedAt: null },
    select: { id: true },
  });
  return !!consultation;
}

export async function getPetVetCard(petId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      pet: {
        id: string;
        name: string;
        species: string;
        breed: string | null;
        birthDate: string | null;
        weightKg: number | null;
        sex: string;
        photoUrl: string | null;
        notes: string | null;
        ownerId: string;
        color: string | null;
        microchip: string | null;
        allergies: string[] | null;
        chronicConditions: string[] | null;
      };
      owner: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        role: string;
      };
      totalConsultations: bigint | number;
      lastConsultationDate: Date | null;
      recent: Array<{
        id: string;
        notes: string | null;
        status: string;
        endedAt: string | null;
        createdAt: string;
        prescriptionCount: number;
      }>;
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
           SELECT c."id", c."notes", c."status", c."endedAt", c."createdAt",
             (SELECT COUNT(*) FROM prescriptions pr WHERE pr."consultationId" = c."id")::int AS "prescriptionCount"
           FROM consultations c
           WHERE c."petId" = ${petId}
           ORDER BY c."createdAt" DESC
           LIMIT 20
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
    recentConsultations: recent.map((c: {
      id: string;
      notes: string | null;
      status: string;
      endedAt: string | null;
      createdAt: string;
      prescriptionCount: number;
    }) => ({
      id: c.id,
      reason: c.notes ?? 'Sin motivo',
      status: c.status,
      completedAt: c.endedAt ? new Date(c.endedAt).toISOString() : null,
      createdAt: c.createdAt,
      prescriptionCount: c.prescriptionCount ?? 0,
    })),
    allergies: pet.allergies ?? [],
    chronicConditions: pet.chronicConditions ?? [],
  };
}
