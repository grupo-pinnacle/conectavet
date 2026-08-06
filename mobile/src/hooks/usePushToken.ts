import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationsService } from '@/services';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function usePushToken(enabled: boolean) {
  useEffect(() => {
    if (!Platform.OS || Platform.OS === 'web') return;

    let cancelled = false;
    (async () => {
      try {
        if (!enabled) return;
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus: Notifications.PermissionStatus = status;
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
}