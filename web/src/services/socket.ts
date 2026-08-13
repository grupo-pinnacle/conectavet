import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(): Promise<Socket> {
  // Reusa la única instancia: nunca recrea (evita sockets huerfanos/fugas).
  if (socket) {
    if (socket.connected) return Promise.resolve(socket);
    const sock = socket;
    return new Promise((resolve, reject) => {
      const onConnect = () => { cleanup(); resolve(sock); };
      const onErr = (err: Error) => { cleanup(); reject(err); };
      const cleanup = () => {
        sock.off("connect", onConnect);
        sock.off("connect_error", onErr);
      };
      sock.on("connect", onConnect);
      sock.on("connect_error", onErr);
      setTimeout(() => {
        cleanup();
        if (sock.connected) resolve(sock);
        else reject(new Error("Socket connection timeout"));
      }, 5000);
    });
  }

  const token = localStorage.getItem("vetconnect_auth_token");
  // En dev Vite proxya /socket.io al backend. En prod se puede apuntar el
  // socket directo al backend con VITE_SOCKET_URL (p.ej. https://api.tu dominio).
  const SOCKET_URL =
    (import.meta.env.VITE_SOCKET_URL as string | undefined) || window.location.origin;
  const sock = io(SOCKET_URL, {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });
  socket = sock;

  return new Promise((resolve, reject) => {
    const onConnect = () => { cleanup(); resolve(sock); };
    const onErr = (err: Error) => { cleanup(); reject(err); };
    const cleanup = () => {
      sock.off("connect", onConnect);
      sock.off("connect_error", onErr);
    };
    sock.on("connect", onConnect);
    sock.on("connect_error", (err) => {
      // El reconector nativo de socket.io ya reintenta; no rechazamos aquí
      // para no dejar la app en modo "ciego" si el primer handshake falla.
      console.warn("Socket connection error:", err.message);
    });
    setTimeout(() => {
      cleanup();
      if (sock.connected) resolve(sock);
      else reject(new Error("Socket connection timeout"));
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

export function joinConsultation(consultationId: string): boolean {
  if (socket?.connected) {
    socket.emit("join:consultation", consultationId);
    return true;
  }
  return false;
}

export function leaveConsultation(consultationId: string): boolean {
  if (socket?.connected) {
    socket.emit("leave:consultation", consultationId);
    return true;
  }
  return false;
}
