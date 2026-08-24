import { io, Socket } from 'socket.io-client';
import { API_URL } from './env';
import { secureStorage } from './secure-storage';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  // Singleton: reusamos la instancia existente en lugar de crear una nueva
  // (que quedaría colgada y filtraría la conexión vieja, P3-11).
  if (socket) {
    if (socket.connected) return socket;
    // Existe pero no conectó todavía: esperamos la (re)conexión.
    return new Promise((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve(socket!);
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        socket!.off('connect', onConnect);
        socket!.off('connect_error', onError);
      };
      socket!.on('connect', onConnect);
      socket!.on('connect_error', onError);
      socket!.connect();
      setTimeout(() => {
        cleanup();
        if (socket?.connected) resolve(socket);
        else reject(new Error('Socket connection timeout'));
      }, 5000);
    });
  }

  const token = await secureStorage.getAccessToken();
  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    // Fábrica de auth: se re-evalúa en CADA intento de conexión/reconexión.
    // Así un socket creado antes del login (token null) se autentica solo
    // cuando el token aparece, sin recrear la instancia ni perder listeners.
    auth: async (cb) => cb({ token: (await secureStorage.getAccessToken()) ?? token ?? '' }),
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

/**
 * Re-aplica un access token nuevo al socket ya conectado (P3-11): el handshake
 * del gateway valida el token al conectar, así que tras un refresh forzamos una
 * reconexión para que use el token actualizado.
 */
export function applySocketToken(token: string) {
  if (!socket) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect().connect();
  }
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
