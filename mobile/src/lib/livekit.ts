import { Room, RoomEvent, Track } from 'livekit-client';
import type { Participant, RemoteParticipant, TrackPublication } from 'livekit-client';
import { useCallStore } from '@/stores/callStore';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL ?? 'ws://localhost:7880';

/**
 * LiveKit helper for the mobile video call screen.
 *
 * The backend (SP-03 → SP-04) creates a LiveKit room named `vetconnect-{entryId}`
 * when a vet takes a queue entry, and issues 2-hour TTL JWTs for both vet and owner.
 * The owner's token arrives via the `ENTRY_ASSIGNED` WebSocket event (queueStore),
 * and the call screen uses it to connect to the room here.
 *
 * Layout rules from the spec (SP-09):
 *   - Remote vet video rendered fullscreen.
 *   - Local owner video rendered as a floating thumbnail.
 *   - Floating controls: mute mic, toggle camera, hang up.
 */
export async function createRoomAndConnect(
  roomName: string,
  token: string,
  onRemoteTrack: (track: Track) => void,
  onParticipantLeft: () => void,
  onDisconnected: () => void
): Promise<Room> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  // Wire up event listeners BEFORE connecting
  room.on(RoomEvent.TrackSubscribed, (track: Track) => {
    onRemoteTrack(track);
  });

  room.on(RoomEvent.ParticipantDisconnected, (_p: RemoteParticipant) => {
    onParticipantLeft();
  });

  room.on(RoomEvent.Disconnected, () => {
    onDisconnected();
  });

  room.on(RoomEvent.TrackMuted, (pub: TrackPublication, _participant: Participant) => {
    useCallStore.getState().setRemoteMuted(pub.kind === Track.Kind.Audio);
  });

  await room.connect(LIVEKIT_URL, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  await room.localParticipant.setCameraEnabled(true);

  return room;
}

export async function disconnectRoom(room: Room | null): Promise<void> {
  if (!room) return;
  try {
    await room.disconnect(true);
  } catch (err) {
    console.warn('[livekit] disconnect failed', err);
  }
}

export async function toggleCamera(room: Room | null): Promise<boolean> {
  if (!room) return false;
  const enabled = !room.localParticipant.isCameraEnabled;
  await room.localParticipant.setCameraEnabled(enabled);
  return enabled;
}

export async function toggleMic(room: Room | null): Promise<boolean> {
  if (!room) return false;
  const enabled = !room.localParticipant.isMicrophoneEnabled;
  await room.localParticipant.setMicrophoneEnabled(enabled);
  return enabled;
}
