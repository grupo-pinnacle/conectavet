import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationsService } from '@/services';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
} catch {
  // expo-notifications no disponible en Expo Go
}

export function usePushToken(enabled: boolean) {
  const router = useRouter();
  const lastNotificationResponse = Notifications?.useLastNotificationResponse();

  // Registro del token de push en el backend.
  useEffect(() => {
    if (!Notifications || !Platform.OS || Platform.OS === 'web') return;

    let cancelled = false;
    (async () => {
      try {
        if (!enabled) return;
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          finalStatus = req.status;
        }
        if (finalStatus !== 'granted' || cancelled) return;
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        if (cancelled || !token) return;
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await notificationsService.registerToken(token, platform);
      } catch {
        // Sin permiso o token no disponible: se ignora, no bloquea la app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Al tocar una notificación, navegamos a la consulta.
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { consultationId?: string }
        | undefined;
      if (data?.consultationId) {
        router.push(`/(app)/chat/${data.consultationId}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  // Arranque en frío: la app se abrió tocando la notificación.
  useEffect(() => {
    const data = lastNotificationResponse?.notification?.request.content.data as
      | { consultationId?: string }
      | undefined;
    if (data?.consultationId) {
      router.push(`/(app)/chat/${data.consultationId}`);
    }
  }, [lastNotificationResponse, router]);
}
