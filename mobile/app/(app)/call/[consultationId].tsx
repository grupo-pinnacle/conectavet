import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
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
    return (
      results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export default function CallScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
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
        if (!cancelled) { setError('Necesitamos permiso de cámara y micrófono para la videollamada.'); setLoading(false); }
        return;
      }
      try {
        const data = await callsService.getToken(consultationId);
        if (!cancelled) {
          setCall(data);
          const socket = getSocket();
          if (socket) socket.emit('call:initiate', consultationId, `${user?.firstName || 'El'} ${user?.lastName || 'cliente'}`);
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

  // El token NO viaja en la URL (evita que quede en logs/proxy/historial del
  // dispositivo): la web lo recibe por postMessage tras cargar la página.
  const source = call
    ? { uri: `${WEB_URL}/call?room=${encodeURIComponent(call.room)}` }
    : undefined;

  const sendCallInit = useCallback(() => {
    if (!call) return;
    const payload = JSON.stringify({ type: 'call:init', url: call.url, token: call.token, room: call.room });
    webRef.current?.postMessage(payload);
    // Re-envío diferido por si el listener de la web aún no se había montado.
    setTimeout(() => webRef.current?.postMessage(payload), 800);
  }, [call]);

  // Vuelve siempre al chat de la consulta (nunca al inicio), tanto al cerrar
  // la llamada como al tocar "Volver" tras un error.
  const onClose = useCallback(() => {
    router.replace(`/(app)/chat/${consultationId}`);
  }, [router, consultationId]);

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', paddingTop: insets.top }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={{ color: '#CBD5E1', fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}>
            Conectando a la videollamada…
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
          <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: '#7F1D1D', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialCommunityIcons name="phone-off" size={30} color="#FCA5A5" />
          </View>
          <Text style={{ color: '#FCA5A5', fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, textAlign: 'center' }}>
            No se pudo iniciar la llamada
          </Text>
          <Text style={{ color: '#CBD5E1', fontSize: fontSizes.body, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }}>
            {error}
          </Text>
          <Pressable
            onPress={onClose}
            style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: c.primary }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={{ color: c.white, fontWeight: fontWeights.bold, fontSize: fontSizes.body }}>Volver</Text>
          </Pressable>
        </View>
      ) : source ? (
        <>
          <WebView
            ref={webRef}
            source={source}
            style={{ flex: 1, backgroundColor: '#020617' }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
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
              if (status >= 400) setError('La web de videollamada no está disponible. Verificá que la web esté corriendo.');
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
        </>
      ) : null}
    </View>
  );
}
