import type { QueryClient } from '@tanstack/react-query';
import { connectSocket } from './socket';

/**
 * Tiempo real global: con el socket autenticado, invalida las caches de
 * React Query ante eventos del backend. Las pantallas muestran datos
 * frescos al instante, sin polling ni recargar.
 */
const EVENTS_TO_KEYS: Record<string, string[][]> = {
  'consultation:new': [['consultations']],
  'consultation:updated': [['consultations']],
  'prescription:new': [['consultations']],
  'notification:new': [['notifications']],
  'vet:availability': [['vets']],
  'pet:updated': [['pets']],
};

export async function startRealtimeSync(queryClient: QueryClient): Promise<() => void> {
  let socket: Awaited<ReturnType<typeof connectSocket>> | null = null;
  const handlers: Array<[string, () => void]> = [];

  try {
    socket = await connectSocket();
  } catch {
    // Sin socket, los hooks mantienen su polling fallback
    return () => {};
  }

  for (const [event, keys] of Object.entries(EVENTS_TO_KEYS)) {
    const handler = () => {
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };
    handlers.push([event, handler]);
    socket.on(event, handler);
  }

  return () => {
    if (!socket) return;
    for (const [event, handler] of handlers) socket.off(event, handler);
  };
}
