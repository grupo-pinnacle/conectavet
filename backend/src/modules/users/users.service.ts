import { prisma } from '../../shared/prisma';

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

export async function listVets(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [vets, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'VET' },
      select: { id: true, email: true, role: true, isOnline: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: { role: 'VET' } }),
  ]);
  return { data: vets, total, page, limit, totalPages: Math.ceil(total / limit) };
}
