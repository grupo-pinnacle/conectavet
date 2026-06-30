import { useEffect, useRef } from 'react';
import { WebSocketClient } from '@/lib/ws';
import { useQueueStore } from '@/stores/queueStore';
import { useAuth } from './useAuth';
import type { WsMessage } from '@/types';

/**
 * Generic WebSocket hook — owns the lifecycle of a `WebSocketClient` instance.
 *
 * The client connects to `/ws/queue` with the user's access token in the
 * query string and dispatches incoming events to `queueStore`. The same
 * event protocol is used by the web app (see INTEGRATION.md §4).
 *
 * Returns the current connection status so callers can render banners.
 */
export function useWebSocket(autoConnect = true) {
  const { isAuthenticated } = useAuth();
  const setWsStatus = useQueueStore((s) => s.setWsStatus);
  const setMyEntry = useQueueStore((s) => s.setMyEntry);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !autoConnect) return;
    const client = new WebSocketClient({ heartbeatIntervalMs: 20_000 });
    clientRef.current = client;

    const offStatus = client.onStatus((s) => setWsStatus(s));
    const offMessage = client.onMessage((msg: WsMessage) => {
      switch (msg.type) {
        case 'ENTRY_STATE':
          setMyEntry(msg.entry);
          break;
        case 'ENTRY_ASSIGNED':
          setMyEntry({ ...msg.entry, livekitToken: msg.livekitToken });
          break;
        case 'CONSULTATION_STARTED':
        case 'CONSULTATION_FINALIZED':
        case 'ENTRY_REQUEUED':
          setMyEntry(msg.entry);
          break;
        case 'QUEUE_UPDATED':
          // Owner doesn't receive QUEUE_UPDATED; vets do. Ignore.
          break;
        case 'pong':
          break;
      }
    });

    client.connect();

    return () => {
      offStatus();
      offMessage();
      client.close();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, autoConnect]);

  return {
    client: clientRef.current,
    send: (msg: unknown) => clientRef.current?.send(msg),
  };
}
