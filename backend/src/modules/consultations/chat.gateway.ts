import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
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

    socket.on('join:consultation', (consultationId: string) => {
      socket.join(`consultation:${consultationId}`);
    });

    socket.on('leave:consultation', (consultationId: string) => {
      socket.leave(`consultation:${consultationId}`);
    });

    socket.on('message:send', async (data: { consultationId: string; content: string }) => {
      try {
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
