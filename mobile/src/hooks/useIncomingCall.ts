import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getSocket } from '@/lib/socket';
import { useDialogStore } from '@/stores/dialogStore';

import * as Haptics from 'expo-haptics';

export function useIncomingCall() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let socketInstance: any = null;
    let handleIncomingCall: ((data: { consultationId: string; callerName?: string }) => void) | null = null;

    const init = async () => {
      try {
        const { connectSocket } = await import('@/lib/socket');
        const socket = await connectSocket();
        if (cancelled) return;
        socketInstance = socket;

        handleIncomingCall = (data: { consultationId: string; callerName?: string }) => {
          // Vibración táctil háptica en el dispositivo móvil
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

          useDialogStore.getState().show({
            type: 'info',
            title: 'Videollamada Entrante',
            message: data.callerName ? `El veterinario ${data.callerName} te está llamando.` : 'El veterinario te está llamando.',
            confirmText: 'Contestar',
            onConfirm: () => {
              router.push(`/(app)/call/${data.consultationId}?accept=true`);
            }
          });
        };

        socket.on('call:incoming', handleIncomingCall);
      } catch (err) {
        console.warn('Socket connection failed in useIncomingCall', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (socketInstance && handleIncomingCall) {
        socketInstance.off('call:incoming', handleIncomingCall);
      }
    };
  }, [router]);
}
