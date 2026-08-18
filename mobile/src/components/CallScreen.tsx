import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Room, RoomEvent, Track, RemoteParticipant } from 'livekit-client';
import { VideoView, AudioSession } from '@livekit/react-native';
import { callsService } from '@/services';

interface RemoteVideo {
  id: string;
  track: any;
}

export default function CallScreen({
  consultationId,
  onClose,
}: {
  consultationId: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [localVideo, setLocalVideo] = useState<any>(null);
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await AudioSession.prepareAudioSession();
        const tokenRes = await callsService.getToken(consultationId);
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const syncRemote = () => {
          const list: RemoteVideo[] = [];
          room.remoteParticipants.forEach((p: RemoteParticipant) => {
            p.getTrackPublications().forEach((pub) => {
              if (pub.track && pub.track.kind === 'video') {
                list.push({ id: `${p.identity}-${pub.trackSid}`, track: pub.track });
              }
            });
          });
          setRemoteVideos(list);
        };
        const syncLocal = () => {
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          setLocalVideo(pub?.videoTrack ?? null);
        };

        room.on(RoomEvent.TrackSubscribed, syncRemote);
        room.on(RoomEvent.TrackUnsubscribed, syncRemote);
        room.on(RoomEvent.ParticipantConnected, syncRemote);
        room.on(RoomEvent.ParticipantDisconnected, syncRemote);
        room.on(RoomEvent.LocalTrackPublished, syncLocal);
        room.on(RoomEvent.LocalTrackUnpublished, syncLocal);
        room.on(RoomEvent.Disconnected, () => {
          if (active) {
            setConnected(false);
            onClose();
          }
        });

        await room.connect(tokenRes.url, tokenRes.token);
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        syncLocal();
        syncRemote();
        if (active) {
          setConnected(true);
        }
      } catch (e: any) {
        if (active) setError(e?.message || 'No se pudo iniciar la llamada');
      }
    })();
    return () => {
      active = false;
      roomRef.current?.disconnect().catch(() => undefined);
    };
  }, [consultationId, onClose]);

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraOn;
    await room.localParticipant.setCameraEnabled(next);
    setCameraOn(next);
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    setLocalVideo(pub?.videoTrack ?? null);
  };

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const hangUp = () => {
    roomRef.current?.disconnect().catch(() => undefined);
    onClose();
  };

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>No se pudo conectar a la videollamada.</Text>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!connected) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.status}>Conectando videollamada…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoGrid}>
        {remoteVideos.map((rv) => (
          <VideoView key={rv.id} videoTrack={rv.track} style={styles.remoteVideo} />
        ))}
        <View style={styles.localWrapper}>
          {cameraOn && localVideo ? (
            <VideoView videoTrack={localVideo} style={styles.localVideo} mirror />
          ) : (
            <View style={[styles.localVideo, styles.placeholder]}>
              <Text style={styles.status}>Cámara apagada</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, !cameraOn && styles.ctrlOff]} onPress={toggleCamera}>
          <Text style={styles.ctrlText}>{cameraOn ? 'Cámara' : 'Cámara off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, !micOn && styles.ctrlOff]} onPress={toggleMic}>
          <Text style={styles.ctrlText}>{micOn ? 'Mic' : 'Mic off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, styles.hangup]} onPress={hangUp}>
          <Text style={styles.ctrlText}>Colgar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b0f', padding: 24 },
  status: { color: '#fff', marginTop: 12 },
  error: { color: '#ff8a8a', textAlign: 'center', marginBottom: 8 },
  videoGrid: { flex: 1, padding: 8, gap: 8 },
  remoteVideo: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1c1c22' },
  localWrapper: { position: 'absolute', right: 16, bottom: 96, width: 110, height: 150 },
  localVideo: { width: 110, height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1c1c22' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 16 },
  ctrlBtn: { backgroundColor: '#2b2b33', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999 },
  ctrlOff: { backgroundColor: '#5a2b2b' },
  hangup: { backgroundColor: '#c0392b' },
  ctrlText: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#2b2b33', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 12 },
  buttonText: { color: '#fff' },
});
