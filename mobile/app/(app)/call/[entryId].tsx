import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { VideoCallView } from '@/components/VideoCallView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useQueue } from '@/hooks/useQueue';
import { useLiveKitCall } from '@/hooks/useLiveKit';
import { useCallStore } from '@/stores/callStore';
import { colors } from '@/theme';
import { requestCameraAndMicPermissions } from '@/utils/permissions';

export default function CallScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const { myEntry, confirmConnection, finalize } = useQueue();
  const callStore = useCallStore();
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Resolve LiveKit token + room from the active entry (delivered via ENTRY_ASSIGNED WS)
  const token = myEntry?.livekitToken ?? '';
  const roomName = myEntry?.livekitRoomName ?? '';
  const isActive = Boolean(
    myEntry && (myEntry.status === 'ASSIGNED' || myEntry.status === 'IN_CONSULTATION') && token && roomName
  );

  // ⚠️ Hooks must run unconditionally — call this with empty strings when inactive.
  // The hook early-returns safely if token/roomName are empty (LiveKit connect fails silently
  // and `error` stays null until isActive is true and we retry).
  const callHook = useLiveKitCall({
    roomName,
    token,
    entryId,
  });

  // Ask for camera/mic permissions on mount
  useEffect(() => {
    if (permissionsAsked) return;
    requestCameraAndMicPermissions().then((ok) => {
      setPermissionsAsked(true);
      if (!ok) {
        Alert.alert(
          'Permisos requeridos',
          'Para la videollamada necesitamos acceso a cámara y micrófono. Podés habilitarlos desde Configuración.',
          [{ text: 'Volver', onPress: () => router.back() }]
        );
      }
    });
  }, [permissionsAsked, router]);

  // Confirm connection once LiveKit connects (entry transitions ASSIGNED → IN_CONSULTATION)
  useEffect(() => {
    if (callStore.connectionState === 'connected' && myEntry?.status === 'ASSIGNED') {
      confirmConnection.mutate(entryId);
    }
  }, [callStore.connectionState, myEntry?.status, entryId, confirmConnection, myEntry]);

  // Call timer
  useEffect(() => {
    if (callStore.connectionState !== 'connected') return;
    const t = setInterval(() => setCallDuration((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [callStore.connectionState]);

  const onHangUp = async () => {
    await callHook.onHangUp();
    try {
      await finalize.mutateAsync(entryId);
    } catch {
      // navigate back even if finalize fails
    }
    router.replace('/(app)/history');
  };

  // ── Render branches ──────────────────────────────────────────────────────

  if (!isActive) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 6 }}>
            No hay una videollamada activa
          </Text>
          <Text style={{ fontSize: 14, color: colors.inkMuted, marginBottom: 16 }}>
            Es posible que la consulta haya finalizado o que aún no se te haya asignado
            un veterinario. Volvé a la pantalla de cola para ver tu estado.
          </Text>
          <Button onPress={() => router.replace('/(app)/queue')}>Ir a la cola</Button>
        </Card>
      </View>
    );
  }

  if (callHook.error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.danger, marginBottom: 6 }}>
            {callHook.error}
          </Text>
          <Text style={{ fontSize: 14, color: colors.inkMuted, marginBottom: 16 }}>
            Verificá tu conexión a internet e intentá nuevamente. Si el problema persiste,
            cancelá la consulta y volvé a unirte a la cola.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button variant="ghost" onPress={() => router.replace('/(app)/queue')} style={{ flex: 1 }}>
              Volver
            </Button>
            <Button
              variant="danger"
              onPress={async () => {
                await finalize.mutateAsync(entryId).catch(() => {});
                router.replace('/(app)/history');
              }}
              style={{ flex: 1 }}
            >
              Finalizar
            </Button>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
      <VideoCallView
        remoteVideoTrack={callHook.remoteVideoTrack}
        isCameraEnabled={callHook.isCameraEnabled}
        isMicEnabled={callHook.isMicEnabled}
        isRemoteMuted={callStore.isRemoteMuted}
        connectionState={callHook.connectionState}
        callDurationSec={callDuration}
        onToggleCamera={callHook.onToggleCamera}
        onToggleMic={callHook.onToggleMic}
        onHangUp={onHangUp}
      />
    </View>
  );
}
