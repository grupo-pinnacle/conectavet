import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { JwtPayload } from '../../shared/types';
import { sendConsultationMessage } from './consultations.service';
import { notifyConsultationMessage } from '../notifications/notifications.service';
import { sendMessageSchema } from './consultations.controller';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { setRedisClient } from './message-throttle';

let io: Server;

export async function setupChatSocket(httpServer: HttpServer) {
  // WS CORS: misma política que el HTTP (app.ts). Si CORS_ORIGIN contiene '*'
  // no se permiten credenciales (espejo de la lógica de app.ts) para evitar
  // el agujero de configuración S-02.
  const wsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  const wsAllowCredentials = !wsOrigins.includes('*');


  // Cliente Redis local a esta instancia (el estado compartido vive en
  // message-throttle vía setRedisClient). Se usa solo si REDIS_URL está seteado.
  let redisClient: Redis | null = null;

  io = new Server(httpServer, {
    cors: {
      origin: wsOrigins,
      credentials: wsAllowCredentials,
    },
  });

  // HA: si hay REDIS_URL, usa adapter compartido para que los mensajes lleguen
  // entre instancias, y comparte rate-limit/dedup.
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL);
      setRedisClient(redisClient!);
      const pub = redisClient!;
      const sub = redisClient!.duplicate();
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
        algorithms: ['HS256'],
      }) as JwtPayload;
      // Re-leemos el usuario para validar tokenVersion (revocación por logout).
      const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!dbUser) return next(new Error('Usuario inválido'));
      if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== dbUser.tokenVersion) {
        return next(new Error('Sesión revocada (logout en otro dispositivo)'));
      }
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload;
    // const _limitKey = user.userId || socket.id;

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
        socket.join(`consultation:${consultationId}`); return;
      } catch (err) {
        socket.emit('error', { message: 'Error al unirse a la consulta' });
        return;
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
      async (data: { consultationId: string; content?: string; attachmentUrl?: string; clientMsgId?: string }, ack?: (res: { message?: unknown; duplicated?: boolean; error?: string }) => void) => {
        try {
          if (!data.consultationId) {
            return socket.emit('error', { message: 'consultationId requerido' });
          }

          const parsed = sendMessageSchema.safeParse(data);
          if (!parsed.success) {
            return socket.emit('error', { message: parsed.error.issues[0].message });
          }

          // const _validData = parsed.data;

          // Lógica única compartida con REST: participación, estado ACTIVE,
          // rate-limit y dedup durable por clientMsgId.
          const result = await sendConsultationMessage({
            userId: user.userId,
            consultationId: data.consultationId,
            content: data.content,
            attachmentUrl: data.attachmentUrl,
            clientMsgId: data.clientMsgId,
          });

          io.to(`consultation:${data.consultationId}`).emit('message:new', result.message);
          if (typeof ack === 'function') ack({ message: result.message, duplicated: result.duplicated });

          // Fire-and-forget: no bloquear el evento de socket esperando el push.
          notifyConsultationMessage(data.consultationId, user.userId).catch(() => {});
          return;
        } catch (error) {
          socket.emit('error', { message: 'Error al guardar el mensaje' });
          return;
        }
      }
    );

    socket.on('call:initiate', async (consultationId: string, peerName: string) => {
      try {
        const consultation = await prisma.consultation.findFirst({
          where: {
            id: consultationId,
            deletedAt: null,
            status: { in: ['ACTIVE', 'PENDING'] },
            OR: [{ clientId: user.userId }, { vetId: user.userId }],
          },
          select: { id: true, clientId: true, vetId: true, status: true },
        });
        if (!consultation) {
          socket.emit('error', { message: 'No participás de una consulta activa' });
          return;
        }
        const targetId = user.userId === consultation.clientId ? consultation.vetId : consultation.clientId;
        if (!targetId) return;

        // Nombre del emisor con fallback a base de datos
        let callerName = (peerName || '').trim();
        if (!callerName) {
          const caller = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { firstName: true, lastName: true, role: true },
          });
          callerName = [caller?.firstName, caller?.lastName].filter(Boolean).join(' ')
            || (caller?.role === 'VET' ? 'Veterinario' : 'Paciente');
        }

        // Emitir a todas las instancias y dispositivos conectados del usuario destinatario
        io.to(`user:${targetId}`).emit('call:incoming', { consultationId, callerName });
      } catch (err) {
        console.error('Error al enrutar call:incoming', err);
      }
    });

    socket.on('call:reject', async (consultationId: string) => {
      try {
        const consultation = await prisma.consultation.findFirst({
          where: {
            id: consultationId,
            deletedAt: null,
            OR: [{ clientId: user.userId }, { vetId: user.userId }],
          },
          select: { clientId: true, vetId: true },
        });
        if (!consultation) return;
        const targetId = user.userId === consultation.clientId ? consultation.vetId : consultation.clientId;
        if (targetId) {
          io.to(`user:${targetId}`).emit('call:rejected', { consultationId });
        }
      } catch {
        /* no-op */
      }
    });

    socket.on('disconnect', async () => {
      if (user.role === 'VET') {
        try {
          const sockets = await io.in(`user:${user.userId}`).fetchSockets();
          if (sockets.length === 0) {
            await prisma.user.update({
              where: { id: user.userId },
              data: { isOnline: false, lastSeen: new Date() },
            });
            io.emit('vet:availability', { vetId: user.userId, isOnline: false });
          }
        } catch {
          /* no-op */
        }
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function disconnectUserSockets(userId: string) {
  if (io) {
    io.in(`user:${userId}`).disconnectSockets(true);
  }
}

