import 'react-native-url-polyfill/auto';
import { secureStorage } from './secure-storage';
import type { WsMessage } from '@/types';
import { WS_URL } from './env';

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: 'connecting' | 'open' | 'closed' | 'error') => void;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

/**
 * WebSocket client for the queue realtime channel (`/ws/queue`).
 *
 * Contract with backend (SP-03):
 *  - Auth: send access token as query param `?token=<jwt>`.
 *  - Heartbeat: client sends `{ type: 'ping' }` every 20s (owner cadence).
 *  - Server pushes discriminated-union messages (see WsMessage type).
 *  - Reconnect with exponential backoff up to 30s.
 *  - On reconnect, server replays current ENTRY_STATE automatically.
 *
 * NOTE: this is ONLY for queue events. LiveKit handles its own signalling
 * for the video call (separate WebRTC channel, see livekit.ts).
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;
  private heartbeatIntervalMs: number;

  constructor(opts?: { heartbeatIntervalMs?: number }) {
    this.url = WS_URL;
    this.heartbeatIntervalMs = opts?.heartbeatIntervalMs ?? 20_000;
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  async connect(): Promise<void> {
    this.isManualClose = false;
    const token = await secureStorage.getAccessToken();
    if (!token) {
      this.emitStatus('error');
      return;
    }
    const fullUrl = `${this.url}?token=${encodeURIComponent(token)}`;
    this.emitStatus('connecting');

    try {
      // React Native ships a global WebSocket; on web use the native browser impl.
      this.ws = new WebSocket(fullUrl);
    } catch (err) {
      console.warn('[ws] constructor failed', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitStatus('open');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as WsMessage;
        this.handlers.forEach((h) => h(parsed));
      } catch (err) {
        console.warn('[ws] malformed message', err);
      }
    };

    this.ws.onerror = () => {
      this.emitStatus('error');
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.emitStatus('closed');
      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };
  }

  send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.isManualClose) return;
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private emitStatus(status: 'connecting' | 'open' | 'closed' | 'error') {
    this.statusHandlers.forEach((h) => h(status));
  }
}
