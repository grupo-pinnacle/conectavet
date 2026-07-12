import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VideoCallView } from '@/components/VideoCallView';
import { Button, Card } from '@/components/ui';
import { useQueue } from '@/hooks/useQueue';
import { useLiveKitCall } from '@/hooks/useLiveKit';
import { useCallStore } from '@/stores/callStore';
import { useTheme, spacing, fontSizes, fontWeights, radius } from '@/theme';
import { requestCameraAndMicPermissions } from '@/utils/permissions';

export default function CallScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const { myEntry, confirmConnection, finalize } = useQueue();
  const callStore = useCallStore();
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const token = myEntry?.livekitToken ?? '';
  const roomName = myEntry?.livekitRoomName ?? '';
  const isActive = Boolean(myEntry && (myEntry.status === 'ASSIGNED' || myEntry.status === 'IN_CONSULTATION') && token && roomName);

  const callHook = useLiveKitCall({ roomName, token, entryId });

  useEffect(() => {
    if (permissionsAsked) return;
    requestCameraAndMicPermissions().then((ok) => {
      setPermissionsAsked(true);
      if (!ok) {
        Alert.alert('Permisos necesarios', 'Para la videollamada necesitamos acceso a cámara y micrófono. Podés habilitarlos desde Configuración.', [{ text: 'Volver', onPress: () => router.back() }]);
      }
    });
  }, [permissionsAsked, router]);

  useEffect(() => {
    if (callStore.connectionState === 'connected' && myEntry?.status === 'ASSIGNED') confirmConnection.mutate(entryId);
  }, [callStore.connectionState, myEntry?.status, entryId, confirmConnection, myEntry]);

  useEffect(() => {
    if (callStore.connectionState !== 'connected') return;
    const t = setInterval(() => setCallDuration((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [callStore.connectionState]);

  const onHangUp = async () => {
    Alert.alert('Finalizar llamada', '¿Estás seguro de que querés terminar la videollamada?', [
      { text: 'Seguir en llamada', style: 'cancel' },
      { text: 'Finalizar', style: 'destructive', onPress: async () => {
        await callHook.onHangUp();
        try { await finalize.mutateAsync(entryId); } catch {}
        router.replace('/(app)/history');
      }},
    ]);
  };

  if (!isActive) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xxl, backgroundColor: c.background }}>
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: c.borderLight, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="phone-off" size={32} color={c.inkMuted} />
            </View>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, textAlign: 'center' }}>No hay una videollamada activa</Text>
          </View>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.lg, textAlign: 'center' }}>
            La consulta puede haber finalizado o aún no se te asignó un veterinario. Revisá tu estado en la cola.
          </Text>
          <Button onPress={() => router.replace('/(app)/queue')} fullWidth>Ir a la cola</Button>
        </Card>
      </View>
    );
  }

  if (callHook.error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xxl, backgroundColor: c.background }}>
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
            <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: c.dangerBg, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="wifi-off" size={32} color={c.danger} />
            </View>
            <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.danger, textAlign: 'center' }}>{callHook.error}</Text>
          </View>
          <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, marginBottom: spacing.lg, textAlign: 'center' }}>
            Verificá tu conexión a internet e intentá nuevamente. Si el problema persiste, cancelá la consulta y volvé a unirte a la cola.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button variant="ghost" onPress={() => router.replace('/(app)/queue')} style={{ flex: 1 }}>Volver</Button>
            <Button variant="danger" onPress={async () => { await finalize.mutateAsync(entryId).catch(() => {}); router.replace('/(app)/history'); }} style={{ flex: 1 }}>Finalizar</Button>
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
