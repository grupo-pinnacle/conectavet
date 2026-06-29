import { useEffect, useRef, useState } from 'react';
import { type Room, Track, type VideoTrack } from 'livekit-client';
import { createRoomAndConnect, toggleCamera, toggleMic, disconnectRoom } from '@/lib/livekit';
import { useCallStore } from '@/stores/callStore';
import { useConsultationPing } from './useConsultations';

interface UseLiveKitCallOpts {
  roomName: string;
  token: string;
  entryId: string;
}

/**
 * LiveKit call hook — used exclusively by `app/(app)/call/[entryId].tsx`.
 *
 * Responsibilities:
 *  1. Connect to the LiveKit room created by the backend when the vet took
 *     the queue entry (the token was delivered via the `ENTRY_ASSIGNED`
 *     WebSocket event).
 *  2. Surface remote vet video track + local owner video track to the UI.
 *  3. Heartbeat `POST /api/consultations/:entryId/ping` every 30s while the
 *     call is active (spec SP-04).
 *  4. Toggle mic / camera via LiveKit's local participant API.
 */
export function useLiveKitCall({ roomName, token, entryId }: UseLiveKitCallOpts) {
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callStore = useCallStore();
  const pingMutation = useConsultationPing();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let disposed = false;
    callStore.setConnectionState('connecting');

    createRoomAndConnect(
      roomName,
      token,
      (track: Track) => {
        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(track as VideoTrack);
        }
      },
      () => {
        // Vet participant left — keep room open for a few seconds so the
        // owner sees the call finalise naturally via WS event.
      },
      () => {
        if (!disposed) callStore.setConnectionState('disconnected');
      }
    )
      .then((r) => {
        if (disposed) {
          disconnectRoom(r);
          return;
        }
        setRoom(r);
        callStore.setConnectionState('connected');

        // Heartbeat every 30s
        heartbeatRef.current = setInterval(() => {
          pingMutation.mutate(entryId);
        }, 30_000);
      })
      .catch((err) => {
        console.warn('[livekit] connect failed', err);
        setError('No se pudo conectar a la videollamada. Intentá nuevamente.');
        callStore.setConnectionState('disconnected');
      });

    return () => {
      disposed = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      callStore.reset();
      setRoom((current: Room | null) => {
        if (current) disconnectRoom(current);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, token]);

  const onToggleCamera = async () => {
    const enabled = await toggleCamera(room);
    callStore.setCameraEnabled(enabled);
    return enabled;
  };

  const onToggleMic = async () => {
    const enabled = await toggleMic(room);
    callStore.setMicEnabled(enabled);
    return enabled;
  };

  const onHangUp = async () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    await disconnectRoom(room);
    callStore.setConnectionState('disconnected');
  };

  return {
    room,
    remoteVideoTrack,
    error,
    connectionState: callStore.connectionState,
    isMicEnabled: callStore.isMicEnabled,
    isCameraEnabled: callStore.isCameraEnabled,
    onToggleCamera,
    onToggleMic,
    onHangUp,
  };
}
