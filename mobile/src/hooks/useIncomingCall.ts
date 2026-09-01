import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getSocket } from '@/lib/socket';
import { useDialogStore } from '@/stores/dialogStore';

export function useIncomingCall() {
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = (data: { consultationId: string; callerName?: string }) => {
      useDialogStore.getState().show({
        type: 'info',
        title: 'Videollamada Entrante',
        message: data.callerName ? `El veterinario ${data.callerName} te está llamando.` : 'El veterinario te está llamando.',
        confirmText: 'Contestar',
        onConfirm: () => {
          router.push(`/(app)/call/${data.consultationId}`);
        }
      });
    };

    socket.on('call:incoming', handleIncomingCall);
    return () => {
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [router]);
}
