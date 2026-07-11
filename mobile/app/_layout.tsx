/**
 * Root Expo Router layout.
 *
 * Sets up the global providers:
 *  - SafeAreaProvider (notch / status bar handling)
 *  - QueryClientProvider (React Query — server state)
 *  - Toast (react-native-toast-message)
 *  - Online/offline banner
 *  - Session-expired redirect
 *
 * Then delegates to `(auth)` or `(app)` group based on `isAuthenticated`.
 *
 * ── Polyfill notice ─────────────────────────────────────────────────────────
 * The first import **must** be @/polyfills because Hermes does not provide
 * `DOMException` natively.  Libraries such as `@react-navigation/native`
 * (router-store.js) and `livekit-client` (DeferrableMap) rely on
 * `AbortController` which internally creates a `DOMException` on abort, and
 * will crash with "Property 'DOMException' doesn't exist" if it is missing.
 * ────────────────────────────────────────────────────────────────────────────
 */
import '@/polyfills';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetwork';
import { colors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;
  return (
    <View style={{ backgroundColor: colors.danger, paddingVertical: 6, paddingHorizontal: 14 }}>
      <Text style={{ color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>
        Sin conexión · Reintentando…
      </Text>
    </View>
  );
}

function RouteGuard() {
  const { isAuthenticated, isHydrated, sessionExpired, clearSessionExpired } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
      Toast.show({
        type: 'error',
        text1: 'Sesión expirada',
        text2: 'Iniciá sesión nuevamente.',
      });
      clearSessionExpired();
      router.replace('/(auth)/login');
    }
  }, [sessionExpired, clearSessionExpired, router]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>VetConnect</Text>
        <Text style={{ color: colors.inkMuted, marginTop: 6 }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RouteGuard />
        <Toast />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
