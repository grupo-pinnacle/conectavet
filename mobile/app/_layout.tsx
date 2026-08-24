import '@/polyfills';

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider, useTheme, fontSizes, fontWeights, spacing, radius } from '@/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { startRealtimeSync } from '@/lib/realtime';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

// Tiempo real: al volver la app al foreground refrescamos las queries visibles
AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});

function LoadingScreen() {
  const { colors: c } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background, gap: spacing.lg }}>
      <View style={{ width: 64, height: 64, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="paw" size={32} color={c.primary} />
      </View>
      <Text style={{ color: c.primary, fontSize: fontSizes.heading, fontWeight: fontWeights.bold, letterSpacing: -0.5 }}>VetConnect</Text>
      <Text style={{ color: c.inkMuted, fontSize: fontSizes.body }}>Cargando…</Text>
    </View>
  );
}

function RouteGuard() {
  const { isAuthenticated, isHydrated, sessionExpired, clearSessionExpired } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors: c } = useTheme();
  const queryClient = useQueryClient();

  // Tiempo real global: conecta el socket e invalida queries ante eventos
  useEffect(() => {
    if (!isAuthenticated) return;
    let cleanup: (() => void) | undefined;
    startRealtimeSync(queryClient).then((fn) => (cleanup = fn));
    return () => cleanup?.();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isHydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  useEffect(() => {
    if (sessionExpired) {
      Toast.show({ type: 'error', text1: 'Sesión expirada', text2: 'Iniciá sesión nuevamente.' });
      clearSessionExpired();
      router.replace('/(auth)/login');
    }
  }, [sessionExpired, clearSessionExpired, router]);

  if (!isHydrated) return <LoadingScreen />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <ErrorBoundary>
            <RouteGuard />
          </ErrorBoundary>
          <Toast />
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
