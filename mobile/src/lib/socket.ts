import { io, Socket } from 'socket.io-client';
import { API_URL } from './env';
import { secureStorage } from './secure-storage';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await secureStorage.getAccessToken();
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return new Promise((resolve, reject) => {
    socket!.on('connect', () => resolve(socket!));
    socket!.on('connect_error', (err) => reject(err));
    setTimeout(() => {
      if (socket?.connected) resolve(socket);
      else reject(new Error('Socket connection timeout'));
    }, 5000);
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function joinConsultation(consultationId: string) {
  if (socket?.connected) {
    socket.emit('join:consultation', consultationId);
  }
}

export function leaveConsultation(consultationId: string) {
  if (socket?.connected) {
    socket.emit('leave:consultation', consultationId);
  }
}
