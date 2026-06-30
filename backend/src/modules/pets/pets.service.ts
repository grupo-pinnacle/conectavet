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
  ownerId: string;
}) {
  return prisma.pet.create({ data });
}

export async function updatePet(
  id: string,
  data: { name?: string; species?: string; breed?: string; age?: number; weight?: number },
) {
  return prisma.pet.update({ where: { id }, data });
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
