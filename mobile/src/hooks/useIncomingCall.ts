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
        message: data.callerName ? \El veterinario \ te esta llamando.\ : 'El veterinario te esta llamando.',
        confirmText: 'Contestar',
        onConfirm: () => {
          router.push(\/(app)/call/\\);
        }
      });
    };

    socket.on('call:incoming', handleIncomingCall);
    return () => {
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [router]);
}
