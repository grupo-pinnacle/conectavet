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

// Idempotency window for retried/duplicated messages.
const MSG_DEDUP = new Map<string, number>();
const MSG_DEDUP_TTL = 10_000;

// Redis client compartido (solo si REDIS_URL está configurado). Permite que el
// rate-limit y el dedup sean distribuidos en entornos multi-instancia.
let redisClient: any = null;

function checkRateLimitSync(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(key, recent);
  return true;
}

async function checkRateLimit(key: string): Promise<boolean> {
  if (redisClient) {
    try {
      const count = await redisClient.incr(`ratelimit:${key}`);
      if (count === 1) await redisClient.expire(`ratelimit:${key}`, Math.ceil(RATE_LIMIT_WINDOW / 1000));
      return count <= RATE_LIMIT_MAX;
    } catch {
      // Redis caído -> fallback a in-memory para no bloquear el servicio.
    }
  }
  return checkRateLimitSync(key);
}

async function isDuplicate(consultationId: string, clientMsgId: string): Promise<boolean> {
  const key = `dedup:${consultationId}:${clientMsgId}`;
  if (redisClient) {
    try {
      const result = await redisClient.set(key, '1', 'NX', 'EX', Math.ceil(MSG_DEDUP_TTL / 1000));
      return result === null; // null => ya existía => duplicado
    } catch {
      // fallback a in-memory
    }
  }
  const dedupeKey = `${consultationId}:${clientMsgId}`;
  if (MSG_DEDUP.has(dedupeKey)) return true;
  MSG_DEDUP.set(dedupeKey, Date.now());
  setTimeout(() => MSG_DEDUP.delete(dedupeKey), MSG_DEDUP_TTL);
  return false;
}

let io: Server;

export async function setupChatSocket(httpServer: HttpServer) {
  // WS CORS: misma política que el HTTP (app.ts). Si CORS_ORIGIN contiene '*'
  // no se permiten credenciales (espejo de la lógica de app.ts) para evitar
  // el agujero de configuración S-02.
  const wsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  const wsAllowCredentials = !wsOrigins.includes('*');

  io = new Server(httpServer, {
    cors: {
      origin: wsOrigins,
      credentials: wsAllowCredentials,
    },
  });

  // HA: si hay REDIS_URL, usa adapter compartido para que los mensajes lleguen
  // entre instancias, y comparte rate-limit/dedup. Requiere @socket.io/redis-adapter + ioredis (ya en deps).
  if (process.env.REDIS_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createAdapter } = require('@socket.io/redis-adapter');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis');
      redisClient = new IORedis(process.env.REDIS_URL);
      const pub = redisClient;
      const sub = redisClient.duplicate();
      io.adapter(createAdapter(pub, sub));
      console.info('[socket] Redis adapter activado (multi-instancia) + rate-limit/dedup distribuido');
    } catch (err) {
      redisClient = null;
      console.warn(
        '[socket] REDIS_URL presente pero no se pudo activar el adapter. ' +
          'Usando adapter en memoria (NO apto para >1 instancia).'
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
            deletedAt: null,
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
          if (!(await checkRateLimit(limitKey))) {
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
          if (
            hasAttachment &&
            !data.attachmentUrl!.startsWith('/uploads/') &&
            !data.attachmentUrl!.startsWith('https://')
          ) {
            return socket.emit('error', { message: 'La imagen adjunta es inválida' });
          }

          // Idempotencia: evita duplicados por reintentos/desconexiones (distribuido si hay Redis).
          if (data.clientMsgId && (await isDuplicate(data.consultationId, data.clientMsgId))) {
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
