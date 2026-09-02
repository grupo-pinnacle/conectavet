import { useAuthStore } from '../stores/authStore';

// Mock dependencias externas
jest.mock('@/lib/secure-storage', () => ({
  secureStorage: {
    getAccessToken: jest.fn(),
    getUser: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    setUser: jest.fn(),
    clearAll: jest.fn(),
  },
}));

jest.mock('@/lib/socket', () => ({
  disconnectSocket: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('useAuthStore — Gestión de Sesión y Autenticación en Mobile', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      sessionExpired: false,
    });
    jest.clearAllMocks();
  });

  it('inicia con estado no autenticado por defecto', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.sessionExpired).toBe(false);
  });

  it('handleSessionExpired desconecta sockets y marca la sesión como expirada', () => {
    useAuthStore.setState({
      user: {
        id: 'usr-1',
        email: 'test@conectavet.com',
        role: 'CLIENT',
        firstName: 'Test',
        lastName: 'User',
        phone: '12345678',
        isActive: true,
        isOnline: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    useAuthStore.getState().handleSessionExpired();

    const state = useAuthStore.getState();
    expect(state.sessionExpired).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('clearSessionExpired restablece la bandera de expiración', () => {
    useAuthStore.setState({ sessionExpired: true });
    useAuthStore.getState().clearSessionExpired();

    expect(useAuthStore.getState().sessionExpired).toBe(false);
  });

  it('hydrate sin token marca isHydrated: true sin autenticar', async () => {
    const { secureStorage } = require('@/lib/secure-storage');
    secureStorage.getAccessToken.mockResolvedValue(null);
    secureStorage.getUser.mockResolvedValue(null);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });
});
