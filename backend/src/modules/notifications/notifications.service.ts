import { prisma } from '../../shared/prisma';
import { logger } from '../../shared/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function registerPushToken(userId: string, token: string, platform: string) {
  return prisma.pushToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });
}

export async function unregisterPushToken(userId: string, token: string) {
  return prisma.pushToken.deleteMany({ where: { token, userId } });
}

export async function listNotifications(userId: string, limit = 50) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: unknown;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data ?? undefined,
    },
  });
}

async function sendExpoPush(tokens: string[], title: string, body: string, data?: unknown) {
  if (process.env.EXPO_PUSH_DISABLED === 'true') return;
  try {
    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: 'default' as const,
      data,
    }));
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    logger.warn('Push notification falló', { error: (error as Error).message });
  }
}

/**
 * Crea la notificación en BD (bandeja in-app), la emite por socket a la sala
 * personal user:{id} y, si el usuario tiene tokens registrados, envía push
 * vía API de Expo (best-effort).
 */
export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: unknown
) {
  const notification = await createNotification({ userId, type, title, body, data });
  try {
    // Emit por socket para que la web/mobile actualice en vivo sin polling
    const { getIO } = await import('../consultations/chat.gateway.js');
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }
  } catch {
    // socket no disponible; la bandeja in-app igual queda actualizada
  }
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length > 0) {
      await sendExpoPush(tokens.map((t) => t.token), title, body, data);
    }
  } catch {
    // el push es best-effort; la notificación in-app ya quedó guardada
  }
  return notification;
}

export async function notifyVetsOnline(type: string, title: string, body: string, data?: unknown) {
  const vets = await prisma.user.findMany({
    where: { role: 'VET', isOnline: true },
    select: { id: true },
  });
  await Promise.all(vets.map((vet) => notifyUser(vet.id, type, title, body, data)));
}

/**
 * Avisa al OTRO participante de una consulta que hay un mensaje nuevo.
 */
export async function notifyConsultationMessage(consultationId: string, senderId: string) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      vet: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!consultation) return;
  const isClientSender = consultation.client.id === senderId;
  const other = isClientSender ? consultation.vet : consultation.client;
  if (!other) return;
  const senderName = isClientSender
    ? consultation.client.firstName || 'Cliente'
    : consultation.vet?.firstName || 'Veterinario';
  await notifyUser(
    other.id,
    'message',
    'Nuevo mensaje',
    `${senderName} te escribió en la consulta`,
    { consultationId }
  );
}