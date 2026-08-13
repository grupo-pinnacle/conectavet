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
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isHydrated,
    sessionExpired,
    login,
    register,
    logout,
    updateUser,
    clearSessionExpired,
  };
}
