import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPetsByOwner(ownerId: string) {
  return prisma.pet.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
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
  return prisma.pet.delete({ where: { id } });
}
