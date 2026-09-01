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
    // Al ponerse online registramos lastSeen para que la presencia no quede
    // "pegada" si se cae la conexión (P3-4).
    data: { isOnline, lastSeen: isOnline ? new Date() : undefined },
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
  type VetListDTO = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    specialty: string | null;
    role: string;
    isOnline: boolean;
    createdAt: Date;
    ratingAvg: number;
    ratingCount: number;
    isFavorite: boolean;
  };
  
  const cached = getCached<{ data: VetListDTO[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
  if (cached) return cached;
  const skip = (page - 1) * limit;
  const whereConditions = [Prisma.sql`u.role = 'VET'`, Prisma.sql`u."vet_status" = 'APPROVED'`];
  if (onlineOnly) whereConditions.push(Prisma.sql`u."isOnline" = true`);
  if (search) {
    const term = `%${search}%`;
    whereConditions.push(Prisma.sql`(u."firstName" ILIKE ${term} OR u."lastName" ILIKE ${term} OR u.email ILIKE ${term})`);
  }

  const whereClause = Prisma.sql`${Prisma.join(whereConditions, ' AND ')}`;
  const havingClause = minRating && minRating > 0 ? Prisma.sql`HAVING COALESCE(AVG(r.rating), 0) >= ${minRating}` : Prisma.empty;
  
  const orderByClause = sortBy === 'rating' 
    ? Prisma.sql`ORDER BY "ratingAvg" DESC, u."createdAt" DESC` 
    : Prisma.sql`ORDER BY u."createdAt" DESC`;

  // Raw query scale perfectly in DB
  const rawVets = await prisma.$queryRaw<Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    specialty: string | null;
    role: string;
    isOnline: boolean;
    createdAt: Date;
    ratingAvg: number;
    ratingCount: number;
  }>>`
    SELECT 
      u.id, u."firstName", u."lastName", u.specialty, u.role, u."isOnline", u."createdAt",
      ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1)::float as "ratingAvg",
      COUNT(r.id)::int as "ratingCount"
    FROM "users" u
    LEFT JOIN "reviews" r ON r."vetId" = u.id
    WHERE ${whereClause}
    GROUP BY u.id
    ${havingClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${skip}
  `;

  // Need a separate query for total count due to pagination
  const countResult = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(DISTINCT u.id)::int as total
    FROM "users" u
    LEFT JOIN "reviews" r ON r."vetId" = u.id
    WHERE ${whereClause}
    ${havingClause}
  `;
  const total = countResult[0]?.total || 0;

  let favoriteIds = new Set<string>();
  if (viewerId) {
    const favorites = await prisma.favoriteVet.findMany({
      where: { clientId: viewerId },
      select: { vetId: true },
    });
    favoriteIds = new Set(favorites.map((f) => f.vetId));
  }

  const data = rawVets.map(vet => ({
    ...vet,
    isFavorite: favoriteIds.has(vet.id)
  }));

  const result = { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  setCache(cacheKey, result, 30);
  return result;
}

export async function updateVetStatus(vetId: string, vetStatus: 'PENDING' | 'APPROVED') {
  const vet = await prisma.user.findFirst({ where: { id: vetId, role: 'VET' } });
  if (!vet) throw new NotFoundError('Veterinario no encontrado');
  const updated = await prisma.user.update({
    where: { id: vetId },
    data: { vetStatus },
  });
  const { password, ...rest } = updated;
  return rest;
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

export async function listAllUsers(page = 1, limit = 30, search?: string, role?: string) {
  const cappedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * cappedLimit;
  const where: Prisma.UserWhereInput = {};
  if (role && ['CLIENT', 'VET', 'ADMIN'].includes(role)) {
    where.role = role as 'CLIENT' | 'VET' | 'ADMIN';
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: cappedLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        vetStatus: true,
        isOnline: true,
        isEmailVerified: true,
        createdAt: true,
        specialty: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { data: users, total, page, limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) };
}

export async function getAdminStats() {
  const [totalUsers, totalVets, totalClients, pendingVets, totalConsultations, completedConsultations] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VET' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'VET', vetStatus: 'PENDING' } }),
    prisma.consultation.count({ where: { deletedAt: null } }),
    prisma.consultation.count({ where: { status: 'COMPLETED', deletedAt: null } }),
  ]);
  return {
    totalUsers,
    totalVets,
    totalClients,
    pendingVets,
    totalConsultations,
    completedConsultations,
  };
}
export async function batchDeleteUsers(adminId: string, userIds: string[]) {
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  
  for (const user of users) {
    if (user.id === adminId) continue;

    const hasConsultations = await prisma.consultation.findFirst({
      where: {
        OR: [{ clientId: user.id }, { vetId: user.id }]
      }
    });

    if (hasConsultations) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: 'deleted-' + user.id + '@anonymized.com',
          firstName: 'Usuario',
          lastName: 'Eliminado',
          deletedAt: new Date(),
          isOnline: false,
          pushTokens: { deleteMany: {} }
        }
      });
    } else {
      await prisma.user.delete({ where: { id: user.id } });
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'DELETE_USER',
        targetId: user.id,
        details: { softDeleted: !!hasConsultations }
      }
    });
  }
}

export async function listAuditLogs(page = 1, limit = 50) {
  const cappedLimit = Math.min(Math.max(1, limit), 100);
  const skip = (page - 1) * cappedLimit;
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: cappedLimit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count()
  ]);

  return { data: logs, total, page, limit: cappedLimit, totalPages: Math.ceil(total / cappedLimit) };
}
