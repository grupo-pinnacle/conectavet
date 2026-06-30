import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { JwtPayload } from '../../shared/types';
import { saveMessage } from './consultations.service';

let io: Server;

export function setupChatSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

    socket.on('message:send', async (data: { consultationId: string; content: string }) => {
      try {
        if (!data.content || data.content.trim().length === 0) {
          return socket.emit('error', { message: 'El mensaje no puede estar vacío' });
        }
        if (data.content.length > 2000) {
          return socket.emit('error', { message: 'El mensaje no puede superar los 2000 caracteres' });
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
        const message = await saveMessage({
          consultationId: data.consultationId,
          senderId: user.userId,
          content: data.content,
        });
        io.to(`consultation:${data.consultationId}`).emit('message:new', message);
      } catch (error) {
        socket.emit('error', { message: 'Error al guardar el mensaje' });
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  return io;
}
