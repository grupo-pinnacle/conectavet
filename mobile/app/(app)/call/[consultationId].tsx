import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { callsService, type CallToken } from '@/services';
import { WEB_URL } from '@/lib/env';
import { useTheme, spacing, fontSizes, fontWeights, radius } from '@/theme';
import { ApiError } from '@/types';

export default function CallScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const [call, setCall] = useState<CallToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await callsService.getToken(consultationId);
        if (!cancelled) setCall(data);
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
    ? {
        uri:
          `${WEB_URL}/call?url=${encodeURIComponent(call.url)}` +
          `&room=${encodeURIComponent(call.room)}` +
          `&token=${encodeURIComponent(call.token)}`,
      }
    : undefined;

  const onClose = useCallback(() => router.back(), [router]);

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
            source={source}
            style={{ flex: 1, backgroundColor: '#020617' }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
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
