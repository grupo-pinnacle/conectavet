import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, PermissionsAndroid, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebView as WebViewType } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { callsService, type CallToken } from '@/services';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/useAuth';
import { WEB_URL } from '@/lib/env';
import { useTheme, spacing, fontSizes, fontWeights, radius } from '@/theme';
import { ApiError } from '@/types';

async function requestCallPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    const cameraGranted = results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const audioGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    return cameraGranted && audioGranted;
  } catch (err) {
    console.warn('Error requesting permissions', err);
    return false;
  }
}

export default function CallScreen() {
  const { consultationId, accept } = useLocalSearchParams<{ consultationId: string; accept?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const [call, setCall] = useState<CallToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const webRef = useRef<WebViewType>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!WEB_URL) {
        if (!cancelled) { setError('La videollamada no está configurada (falta EXPO_PUBLIC_WEB_URL).'); setLoading(false); }
        return;
      }
      const granted = await requestCallPermissions();
      if (!cancelled) setPerms(granted);
      if (!granted) {
        if (!cancelled) {
          setError('Necesitamos permiso de cámara y micrófono para la videollamada.');
          setLoading(false);
        }
        return;
      }
      try {
        const data = await callsService.getToken(consultationId);
        if (!cancelled) {
          setCall(data);
          let socket = getSocket();
          if (!socket || !socket.connected) {
            try {
              const { connectSocket } = await import('@/lib/socket');
              socket = await connectSocket();
            } catch {
              /* ignore */
            }
          }
          if (socket && accept !== 'true') {
            const callerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Paciente';
            socket.emit('call:initiate', consultationId, callerName);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'No pudimos iniciar la videollamada.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consultationId]);

  const source = call
    ? { uri: `${WEB_URL}/call?room=${encodeURIComponent(call.room)}` }
    : undefined;

  const sendCallInit = useCallback(() => {
    if (!call) return;
    const payloadObj = { type: 'call:init', url: call.url, token: call.token, room: call.room };
    const payload = JSON.stringify(payloadObj);
    
    // Método 1: postMessage estándar (React Native WebView)
    webRef.current?.postMessage(payload);
    
    // Método 2: Inyección de JS directa garantizada (llama a la función global o lanza el evento)
    const js = `
      (function() {
        try {
          if (window.__onCallInit) {
            window.__onCallInit(${payload});
          } else {
            window.postMessage(${payload}, '*');
          }
        } catch(e) {}
      })();
      true;
    `;
    webRef.current?.injectJavaScript(js);
  }, [call]);

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617', padding: spacing.xxl }}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={{ color: c.white, marginTop: spacing.md, fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}>
            Conectando a la videollamada…
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617', padding: spacing.xxl, gap: spacing.md }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={c.danger} />
          <Text style={{ color: c.white, fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, textAlign: 'center' }}>
            No pudimos conectar la llamada
          </Text>
          <Text style={{ color: c.inkMuted, fontSize: fontSizes.body, textAlign: 'center' }}>{error}</Text>
          {perms === false && (
            <Pressable
              onPress={() => Linking.openSettings()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: c.primary,
                borderRadius: radius.full,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                marginTop: spacing.sm,
              }}
            >
              <MaterialCommunityIcons name="cog" size={18} color={c.white} />
              <Text style={{ color: c.white, fontWeight: fontWeights.bold, fontSize: fontSizes.body }}>
                Abrir Ajustes de la App
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.full, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginTop: spacing.xs }}
          >
            <Text style={{ color: c.white, fontWeight: fontWeights.bold, fontSize: fontSizes.body }}>Volver</Text>
          </Pressable>
        </View>
      ) : source ? (
        <View style={{ flex: 1, backgroundColor: '#020617', paddingBottom: insets.bottom }}>
          <WebView
            ref={webRef}
            source={source}
            style={{ flex: 1, backgroundColor: '#020617' }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            {...({
              onPermissionRequest: (event: any) => {
                if (event?.grant && event?.resources) {
                  event.grant(event.resources);
                }
              },
            } as any)}
            androidLayerType="hardware"
            cacheEnabled={false}
            incognito={false}
            onLoad={sendCallInit}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === 'call:ended') {
                  onClose();
                }
              } catch {
                // Ignorar mensajes no JSON de la web
              }
            }}
            onHttpError={(syntheticEvent) => {
              const status = syntheticEvent.nativeEvent.statusCode;
              if (status >= 400) setError('El servicio de videollamada no está disponible en este momento. Por favor intentá nuevamente en unos instantes.');
            }}
            onError={() => {
              setError('Problemas de conexión con la sala de teleconsulta. Verificá tu señal de internet o datos móviles.');
            }}
          />
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: insets.top + spacing.sm,
              right: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: 'rgba(127,29,29,0.95)',
            }}
            accessibilityRole="button"
            accessibilityLabel="Finalizar llamada"
          >
            <Text style={{ color: '#FECACA', fontWeight: fontWeights.bold, fontSize: fontSizes.label }}>
              Terminar llamada
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
