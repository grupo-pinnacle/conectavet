import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { JwtPayload } from '../../shared/types';
import { saveMessage } from './consultations.service';
import { notifyConsultationMessage } from '../notifications';

const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, number[]>();

// Idempotency window for retried/duplicated messages (in-memory; per-process).
const MSG_DEDUP = new Map<string, number>();
const MSG_DEDUP_TTL = 10_000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

let io: Server;

export async function setupChatSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  // HA: si hay REDIS_URL, usa adapter compartido para que los mensajes lleguen
  // entre instancias. Requiere instalar @socket.io/redis-adapter + ioredis.
  if (process.env.REDIS_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAdapter } = require('@socket.io/redis-adapter');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis');
      const pub = new IORedis(process.env.REDIS_URL);
      const sub = pub.duplicate();
      io.adapter(createAdapter(pub, sub));
      console.info('[socket] Redis adapter activado (multi-instancia)');
    } catch (err) {
      console.warn(
        '[socket] REDIS_URL presente pero no se pudo activar el adapter. ' +
          'Instalá @socket.io/redis-adapter + ioredis. Usando adapter en memoria (NO apto para >1 instancia).'
      );
    }
  }

  io.use(async (socket, next) => {
    const cookieToken = (() => {
      const header = socket.handshake.headers.cookie;
      if (!header) return undefined;
      const m = header.match(/(?:^|;\s*)access_token=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : undefined;
    })();
    const token = (socket.handshake.auth?.token as string) || cookieToken;
    if (!token) return next(new Error('Token no proporcionado'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      // Re-leemos el usuario para validar tokenVersion (revocación por logout).
      const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!dbUser) return next(new Error('Usuario inválido'));
      if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== dbUser.tokenVersion) {
        return next(new Error('Sesión revocada (logout en otro dispositivo)'));
      }
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as JwtPayload;
    const limitKey = user.userId || socket.id;

    socket.join(`user:${user.userId}`);

    socket.on('join:consultation', async (consultationId: string) => {
      try {
        const consultation = await prisma.consultation.findFirst({
          where: {
            id: consultationId,
            OR: [{ clientId: user.userId }, { vetId: user.userId }],
          },
        });
        if (!consultation) {
          return socket.emit('error', { message: 'No pertenecés a esta consulta' });
        }
        socket.join(`consultation:${consultationId}`);
      } catch (err) {
        socket.emit('error', { message: 'Error al unirse a la consulta' });
      }
    });

    socket.on('leave:consultation', (consultationId: string) => {
      try {
        socket.leave(`consultation:${consultationId}`);
      } catch {
        /* no-op */
      }
    });

    socket.on(
      'message:send',
      async (data: { consultationId: string; content?: string; attachmentUrl?: string; clientMsgId?: string }, ack?: (r: any) => void) => {
        try {
          if (!checkRateLimit(limitKey)) {
            return socket.emit('error', { message: 'Demasiados mensajes. Esperá un momento.' });
          }
          const hasContent = !!data.content && data.content.trim().length > 0;
          const hasAttachment = !!data.attachmentUrl;
          if (!hasContent && !hasAttachment) {
            return socket.emit('error', { message: 'El mensaje no puede estar vacío' });
          }
          if (data.content && data.content.length > 2000) {
            return socket.emit('error', { message: 'El mensaje no puede superar los 2000 caracteres' });
          }
          if (hasAttachment && !data.attachmentUrl!.startsWith('/uploads/')) {
            return socket.emit('error', { message: 'La imagen adjunta es inválida' });
          }

          // Idempotencia: evita duplicados por reintentos/desconexiones.
          const dedupeKey = data.clientMsgId ? `${data.consultationId}:${data.clientMsgId}` : null;
          if (dedupeKey && MSG_DEDUP.has(dedupeKey)) {
            if (typeof ack === 'function') ack({ skipped: true });
            return;
          }

          const consultation = await prisma.consultation.findFirst({
            where: {
              id: data.consultationId,
              OR: [{ clientId: user.userId }, { vetId: user.userId }],
            },
          });
          if (!consultation) {
            return socket.emit('error', { message: 'No pertenecés a esta consulta' });
          }
          if (consultation.status !== 'ACTIVE') {
            return socket.emit('error', { message: 'La consulta no está activa. No podés enviar mensajes.' });
          }

          // Dedup durable (P3-6): si el cliente ya envió este clientMsgId para
          // esta consulta, devolvemos el mensaje existente en lugar de duplicar.
          // Esto cubre reintentos y el caso multi-instancia (más allá del
          // dedup en memoria de arriba).
          if (data.clientMsgId) {
            const existing = await prisma.message.findFirst({
              where: { consultationId: data.consultationId, clientMsgId: data.clientMsgId },
              include: { sender: { select: { id: true, email: true, role: true } } },
            });
            if (existing) {
              if (typeof ack === 'function') ack({ message: existing, duplicated: true });
              return;
            }
          }

          const message = await saveMessage({
            consultationId: data.consultationId,
            senderId: user.userId,
            content: data.content,
            attachmentUrl: data.attachmentUrl,
            clientMsgId: data.clientMsgId,
          });

          if (dedupeKey) {
            MSG_DEDUP.set(dedupeKey, Date.now());
            setTimeout(() => MSG_DEDUP.delete(dedupeKey), MSG_DEDUP_TTL);
          }

          io.to(`consultation:${data.consultationId}`).emit('message:new', message);
          if (typeof ack === 'function') ack({ message });

          // Fire-and-forget: no bloquear el evento de socket esperando el push.
          notifyConsultationMessage(data.consultationId, user.userId).catch(() => {});
        } catch (error) {
          socket.emit('error', { message: 'Error al guardar el mensaje' });
        }
      }
    );

    socket.on('disconnect', () => {
      rateLimitMap.delete(socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
