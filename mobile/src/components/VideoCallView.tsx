import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { VideoTrack } from 'livekit-client';
import { useTheme, spacing, radius, fontSizes, fontWeights, shadows, motion } from '@/theme';

interface VideoCallViewProps {
  remoteVideoTrack: VideoTrack | null;
  localVideoTrack?: VideoTrack | null;
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

interface ControlButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  isActive: boolean;
  accessibilityLabel: string;
  size?: number;
  variant?: 'hangup' | 'toggle';
}

function ControlButton({ icon, onPress, isActive, accessibilityLabel, size = 56, variant = 'toggle' }: ControlButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 350, mass: 0.5 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 350, mass: 0.5 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: !isActive }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: variant === 'hangup'
            ? '#EF4444'
            : isActive
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(255,255,255,0.08)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: isActive ? 0 : 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <MaterialCommunityIcons name={icon} size={size * 0.42} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

export function VideoCallView({
  remoteVideoTrack, localVideoTrack, isCameraEnabled, isMicEnabled, isRemoteMuted,
  connectionState, callDurationSec, onToggleCamera, onToggleMic, onHangUp,
}: VideoCallViewProps) {
  const { colors: c } = useTheme();
  const controlsOpacity = useSharedValue(1);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isScreenPressed, setIsScreenPressed] = useState(false);

  const connecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  const RemoteVideoView = remoteVideoTrack
    ? require('@livekit/react-native').VideoView
    : null;

  const LocalVideoView = localVideoTrack && isCameraEnabled
    ? require('@livekit/react-native').VideoView
    : null;

  const resetControlsTimer = useCallback(() => {
    controlsOpacity.value = withSpring(1, motion.springGentle);
    setIsScreenPressed(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: motion.duration.slow, easing: Easing.out(Easing.ease) });
      setIsScreenPressed(false);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const controlsAnimStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
      <Pressable
        style={{ flex: 1, position: 'relative' }}
        onPress={resetControlsTimer}
        accessibilityLabel="Pantalla de videollamada"
      >
        {remoteVideoTrack && RemoteVideoView ? (
          <RemoteVideoView track={remoteVideoTrack} style={{ flex: 1 }} mirror={false} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 88, height: 88, borderRadius: radius.full,
                backgroundColor: 'rgba(255,255,255,0.08)',
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="stethoscope" size={44} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.input, fontWeight: fontWeights.semibold }}>
              {connecting ? 'Conectando con el veterinario…' : 'Esperando video del veterinario…'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: fontSizes.body, textAlign: 'center', maxWidth: 280 }}>
              {connecting ? 'Estableciendo conexión segura' : 'La cámara del veterinario se activará en breve'}
            </Text>
          </View>
        )}

        {/* Connection state badge — top center */}
        {connecting && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              position: 'absolute', top: 48, alignSelf: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
              borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
            }}
          >
            <MaterialCommunityIcons name="loading" size={14} color="#FFFFFF" />
            <Text style={{ color: '#fff', fontSize: fontSizes.label, fontWeight: fontWeights.semibold }}>
              Conectando…
            </Text>
          </Animated.View>
        )}

        {/* Top bar — timer + remote mute indicator */}
        <Animated.View
          style={[{
            position: 'absolute', top: 48, left: spacing.lg, right: spacing.lg,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }, controlsAnimStyle]}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
              borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
            }}
          >
            <MaterialCommunityIcons name="clock-outline" size={14} color="#FFFFFF" />
            <Text style={{ color: '#fff', fontSize: fontSizes.label, fontWeight: fontWeights.semibold }}>
              {connectionState === 'connected' ? formatDuration(callDurationSec) : '—'}
            </Text>
          </View>
          {isRemoteMuted && (
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.75)',
                paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
              }}
            >
              <MaterialCommunityIcons name="microphone-off" size={14} color="#FFFFFF" />
              <Text style={{ color: '#fff', fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                Veterinario en silencio
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Local video — PiP (picture-in-picture) bottom-right */}
        {(isCameraEnabled && LocalVideoView && localVideoTrack) ? (
          <View
            style={{
              position: 'absolute', bottom: 120, right: spacing.lg,
              width: 100, height: 140,
              borderRadius: radius.lg, overflow: 'hidden',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
              ...shadows.raised,
            }}
          >
            <LocalVideoView track={localVideoTrack} style={{ flex: 1 }} mirror />
          </View>
        ) : (
          <View
            style={{
              position: 'absolute', bottom: 120, right: spacing.lg,
              width: 100, height: 140,
              borderRadius: radius.lg,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            {!isCameraEnabled && (
              <MaterialCommunityIcons name="camera-off" size={28} color="rgba(255,255,255,0.4)" />
            )}
          </View>
        )}
      </Pressable>

      {/* Controls bar */}
      <Animated.View
        style={[{
          position: 'absolute', bottom: 48, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          gap: spacing.xxl,
          paddingBottom: spacing.sm,
        }, controlsAnimStyle]}
      >
        <ControlButton
          icon={isMicEnabled ? 'microphone' : 'microphone-off'}
          onPress={() => { onToggleMic(); resetControlsTimer(); }}
          isActive={isMicEnabled}
          accessibilityLabel={isMicEnabled ? 'Silenciar micrófono' : 'Activar micrófono'}
        />
        <ControlButton
          icon="phone-hangup"
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); onHangUp(); }}
          isActive={false}
          accessibilityLabel="Finalizar llamada"
          size={64}
          variant="hangup"
        />
        <ControlButton
          icon={isCameraEnabled ? 'camera' : 'camera-off'}
          onPress={() => { onToggleCamera(); resetControlsTimer(); }}
          isActive={isCameraEnabled}
          accessibilityLabel={isCameraEnabled ? 'Apagar cámara' : 'Activar cámara'}
        />
      </Animated.View>
    </View>
  );
}