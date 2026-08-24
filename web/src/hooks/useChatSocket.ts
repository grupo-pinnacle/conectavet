import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

type SocketSetup = (socket: Socket) => (() => void) | void;

/**
 * Conexión compartida del socket de chat. Antes había dos implementaciones
 * casi idénticas en MessagesSection (cliente) y VetMessagesSection (vet) que
 * derivaban (el bug P2-5 vivía ahí). Ahora ambas secciones pasan su `setup`
 * (registra los listeners y devuelve la limpieza) y este hook se encarga de
 * conectar, reintentar si el handshake inicial rechaza, y limpiar.
 */
export function useChatSocket(setup: SocketSetup, deps: unknown[] = []) {
  const [socketConnected, setSocketConnected] = useState<boolean>(
    () => getSocket()?.connected ?? false
  );

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | void;

    const attach = (socket: Socket) => {
      if (cancelled || !socket) return;
      setSocketConnected(socket.connected);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      const userTeardown = setup(socket);
      teardown = () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        if (typeof userTeardown === 'function') userTeardown();
      };
    };

    connectSocket()
      .then(attach)
      .catch(() => {
        const sock = getSocket();
        if (sock) attach(sock);
      });

    return () => {
      cancelled = true;
      if (typeof teardown === 'function') teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { socketConnected };
}
