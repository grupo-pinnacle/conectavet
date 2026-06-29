import { create } from 'zustand';

/**
 * Video call UI state. LiveKit connection + remote/local tracks live in the
 * call screen via the `useLiveKitCall` hook; this store holds the high-level
 * flags the controls overlay reads (mic/camera enabled, remote-muted, …).
 */
interface CallState {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isRemoteMuted: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  callDurationSec: number;

  setMicEnabled: (v: boolean) => void;
  setCameraEnabled: (v: boolean) => void;
  setRemoteMuted: (v: boolean) => void;
  setConnectionState: (s: CallState['connectionState']) => void;
  setCallDurationSec: (n: number) => void;

  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  isMicEnabled: true,
  isCameraEnabled: true,
  isRemoteMuted: false,
  connectionState: 'idle',
  callDurationSec: 0,

  setMicEnabled: (v) => set({ isMicEnabled: v }),
  setCameraEnabled: (v) => set({ isCameraEnabled: v }),
  setRemoteMuted: (v) => set({ isRemoteMuted: v }),
  setConnectionState: (s) => set({ connectionState: s }),
  setCallDurationSec: (n) => set({ callDurationSec: n }),
  reset: () =>
    set({
      isMicEnabled: true,
      isCameraEnabled: true,
      isRemoteMuted: false,
      connectionState: 'idle',
      callDurationSec: 0,
    }),
}));
