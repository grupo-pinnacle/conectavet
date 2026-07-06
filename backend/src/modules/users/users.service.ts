import { prisma } from '../../shared/prisma';
import { getCached, setCache } from '../../shared/cache';

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
  const cacheKey = `vets:list:${page}:${limit}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
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
  const result = { data: vets, total, page, limit, totalPages: Math.ceil(total / limit) };
  setCache(cacheKey, result, 60);
  return result;
}
