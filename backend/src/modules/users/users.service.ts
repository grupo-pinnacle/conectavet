import { prisma } from '../../shared/prisma';
import { getCached, setCache, clearCache } from '../../shared/cache';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

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

const SALT_ROUNDS = 12;

/**
 * Alta de usuario por un ADMIN (vets, clientes o admins). Nunca se expone
 * vía el registro público, que solo crea CLIENT. Valida unicidad de email
 * y hashea la password con el mismo costo que el registro.
 */
export async function createUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'CLIENT' | 'VET' | 'ADMIN';
  specialty?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError('Este email ya está registrado');
  }
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      // La matrícula/especialidad solo aplica a veterinarios.
      specialty: data.role === 'VET' ? data.specialty || null : null,
    },
  });
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateProfile(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string; bio?: string; specialty?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName || null }),
      ...(data.lastName !== undefined && { lastName: data.lastName || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.bio !== undefined && { bio: data.bio || null }),
      ...(data.specialty !== undefined && { specialty: data.specialty || null }),
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateAvailability(userId: string, isOnline: boolean) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnline },
  });

  // Invalidar caches de vets disponibles/lista al cambiar el estado
  clearCache('vets:available');
  clearCache('vets:list:available');
  clearCache('vets:list:');

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function listVets(
  page = 1,
  limit = 20,
  filters: {
    search?: string;
    onlineOnly?: boolean;
    viewerId?: string;
    minRating?: number;
    sortBy?: 'rating' | 'recent';
  } = {}
) {
  const { search, onlineOnly, viewerId, minRating, sortBy } = filters;
  const cacheKey = `vets:list:${page}:${limit}:${search?.toLowerCase()}:${onlineOnly}:${viewerId ?? 'anon'}:${minRating ?? 0}:${sortBy ?? 'recent'}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  const skip = (page - 1) * limit;
  const where: Prisma.UserWhereInput = {
    role: 'VET',
    ...(onlineOnly ? { isOnline: true } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { specialty: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [allVets, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        specialty: true,
        role: true,
        isOnline: true,
        createdAt: true,
        reviewsAsVet: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  let favoriteIds = new Set<string>();
  if (viewerId) {
    const favorites = await prisma.favoriteVet.findMany({
      where: { clientId: viewerId },
      select: { vetId: true },
    });
    favoriteIds = new Set(favorites.map((f) => f.vetId));
  }

  const withRatings = allVets.map(({ reviewsAsVet, ...vet }) => {
    const ratingCount = reviewsAsVet.length;
    const ratingAvg = ratingCount > 0
      ? Math.round((reviewsAsVet.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
      : null;
    return { ...vet, ratingAvg, ratingCount, isFavorite: favoriteIds.has(vet.id) };
  });

  const filtered = withRatings
    .filter((vet) => (minRating && minRating > 0 ? (vet.ratingAvg ?? 0) >= minRating : true))
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const data = filtered.slice(skip, skip + limit);
  const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  setCache(cacheKey, result, 30);
  return result;
}

export async function getVetById(vetId: string) {
  const vet = await prisma.user.findFirst({
    where: { id: vetId, role: 'VET' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      bio: true,
      specialty: true,
      isOnline: true,
      createdAt: true,
      reviewsAsVet: { select: { rating: true, comment: true, createdAt: true } },
    },
  });
  if (!vet) throw new NotFoundError('Veterinario no encontrado');
  const { reviewsAsVet, ...rest } = vet;
  const totalRatings = reviewsAsVet.length;
  const ratingAvg = totalRatings > 0
    ? Math.round((reviewsAsVet.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
    : null;
  return {
    ...rest,
    ratingAvg,
    ratingCount: totalRatings,
    reviews: reviewsAsVet.slice(0, 10),
  };
}

export async function addFavorite(clientId: string, vetId: string) {
  const vet = await prisma.user.findFirst({ where: { id: vetId, role: 'VET' } });
  if (!vet) throw new NotFoundError('Veterinario no encontrado');
  await prisma.favoriteVet.upsert({
    where: { clientId_vetId: { clientId, vetId } },
    create: { clientId, vetId },
    update: {},
  });
  clearCache(`vets:list:`);
}

export async function removeFavorite(clientId: string, vetId: string) {
  await prisma.favoriteVet.deleteMany({ where: { clientId, vetId } });
  clearCache(`vets:list:`);
}

export async function listFavorites(clientId: string) {
  const favorites = await prisma.favoriteVet.findMany({
    where: { clientId },
    include: {
      vet: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          specialty: true,
          isOnline: true,
          reviewsAsVet: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return favorites.map(({ vet, ...f }) => {
    const totalRatings = vet.reviewsAsVet.length;
    const ratingAvg = totalRatings > 0
      ? Math.round((vet.reviewsAsVet.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
      : null;
    return { ...f, vet: { ...vet, ratingAvg, ratingCount: totalRatings, isFavorite: true } };
  });
}
