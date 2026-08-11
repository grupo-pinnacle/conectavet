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

function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(socketId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(socketId, recent);
  return true;
}

let io: Server;

export function setupChatSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error('Token no proporcionado'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as JwtPayload;

    // Sala personal: notificaciones y actualizaciones de consultas en vivo
    socket.join(`user:${user.userId}`);

    socket.on('join:consultation', async (consultationId: string) => {
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
    });

    socket.on('leave:consultation', (consultationId: string) => {
      socket.leave(`consultation:${consultationId}`);
    });

    socket.on(
      'message:send',
      async (data: { consultationId: string; content?: string; attachmentUrl?: string }) => {
        try {
          if (!checkRateLimit(socket.id)) {
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
          const message = await saveMessage({
            consultationId: data.consultationId,
            senderId: user.userId,
            content: data.content,
            attachmentUrl: data.attachmentUrl,
          });
          io.to(`consultation:${data.consultationId}`).emit('message:new', message);
          await notifyConsultationMessage(data.consultationId, user.userId);
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
