import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return null;
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function listVets() {
  const vets = await prisma.user.findMany({
    where: { role: 'VET' },
    select: { id: true, email: true, role: true, isOnline: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return vets;
}
