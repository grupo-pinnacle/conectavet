import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Tracks online/offline state via `@react-native-community/netinfo`.
 * The root layout renders a "Sin conexión" banner when this returns false.
 *
 * On reconnect, the queue store refetches the active entry and React Query
 * refetches stale queries (configured globally).
 */
export function useNetworkStatus(): { isOnline: boolean; isChecking: boolean } {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsChecking(true);
      const online = Boolean(state.isConnected && state.isInternetReachable);
      setIsOnline(online);
      setTimeout(() => setIsChecking(false), 500);
    });
    return () => unsub();
  }, []);

  return { isOnline, isChecking };
}
