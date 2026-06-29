import { Pressable, Text, View } from 'react-native';
import type { VideoTrack } from 'livekit-client';
import { colors } from '@/theme';

interface VideoCallViewProps {
  remoteVideoTrack: VideoTrack | null;
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  isRemoteMuted: boolean;
  connectionState: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  callDurationSec: number;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onHangUp: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VideoCallView({
  remoteVideoTrack,
  isCameraEnabled,
  isMicEnabled,
  isRemoteMuted,
  connectionState,
  callDurationSec,
  onToggleCamera,
  onToggleMic,
  onHangUp,
}: VideoCallViewProps) {
  const RemoteVideoView = remoteVideoTrack
    ? require('@livekit/react-native').VideoView
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
      {/* Remote vet video (fullscreen) */}
      <View style={{ flex: 1, position: 'relative' }}>
        {remoteVideoTrack && RemoteVideoView ? (
          <RemoteVideoView
            track={remoteVideoTrack}
            style={{ flex: 1 }}
            mirror={false}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 64 }}>🩺</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {connectionState === 'connecting'
                ? 'Conectando con el veterinario…'
                : 'Esperando video del veterinario…'}
            </Text>
          </View>
        )}

        {/* Top bar — duration + connection state */}
        <View
          style={{
            position: 'absolute',
            top: 48,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              {connectionState === 'connected' ? formatDuration(callDurationSec) : '—'}
            </Text>
          </View>
          {isRemoteMuted && (
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.9)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Vet en silencio 🔇
              </Text>
            </View>
          )}
        </View>

        {/* Local camera thumbnail */}
        <View
          style={{
            position: 'absolute',
            top: 96,
            right: 16,
            width: 100,
            height: 140,
            backgroundColor: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, opacity: 0.6 }}>
            {isCameraEnabled ? '' : 'Cámara apagada'}
          </Text>
        </View>
      </View>

      {/* Floating controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 56,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <Pressable
          onPress={onToggleMic}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isMicEnabled ? 'rgba(0,0,0,0.6)' : colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>{isMicEnabled ? '🎤' : '🔇'}</Text>
        </Pressable>

        <Pressable
          onPress={onToggleCamera}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isCameraEnabled ? 'rgba(0,0,0,0.6)' : colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>{isCameraEnabled ? '📷' : '📵'}</Text>
        </Pressable>

        <Pressable
          onPress={onHangUp}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>📞</Text>
        </Pressable>
      </View>
    </View>
  );
}
