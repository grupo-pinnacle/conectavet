import { create } from 'zustand';
import type { QueueEntry } from '@/types';

/**
 * Queue realtime store.
 *
 * Holds the owner's active queue entry and connection status of the WebSocket.
 * Updated by:
 *  - REST calls (join, cancel, finalize) via useQueue hook
 *  - WebSocket events (ENTRY_STATE, ENTRY_ASSIGNED, CONSULTATION_STARTED, …)
 *    received via useWebSocket → queueStore setters
 *
 * The web app has the equivalent store at `apps/web/src/stores/queueStore.ts`
 * with identical shape — see INTEGRATION.md §2.
 */
interface QueueState {
  myEntry: QueueEntry | null;
  wsStatus: 'idle' | 'connecting' | 'open' | 'closed' | 'error';
  lastUpdatedAt: number | null;

  setMyEntry: (entry: QueueEntry | null) => void;
  setWsStatus: (status: QueueState['wsStatus']) => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  myEntry: null,
  wsStatus: 'idle',
  lastUpdatedAt: null,

  setMyEntry: (entry) => set({ myEntry: entry, lastUpdatedAt: Date.now() }),
  setWsStatus: (status) => set({ wsStatus: status }),
  reset: () => set({ myEntry: null, wsStatus: 'idle', lastUpdatedAt: null }),
}));
