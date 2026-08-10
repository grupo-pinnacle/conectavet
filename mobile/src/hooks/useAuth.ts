import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Top-level auth hook. On first mount, hydrates the store from SecureStore
 * (access token + cached user). Screens read `user`, `isAuthenticated`,
 * `isLoading`, and `sessionExpired` from here.
 *
 * The `sessionExpired` flag is consumed by the root layout to redirect to
 * `/login` with a toast when the API layer detected an unrecoverable 401.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.isHydrated) {
      store.hydrate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isHydrated: store.isHydrated,
    sessionExpired: store.sessionExpired,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateUser: store.updateUser,
    clearSessionExpired: store.clearSessionExpired,
  };
}
