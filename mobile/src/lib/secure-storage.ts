import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage wrapper.
 *
 * - On native (iOS / Android) uses `expo-secure-store` which stores values
 *   in the Android Keystore / iOS Keychain (encrypted at rest).
 * - On web (Expo Web fallback) `expo-secure-store` is unavailable, so we
 *   fall back to `localStorage`. This is acceptable for development only.
 *
 * Used to persist:
 *   - `accessToken`  (JWT, 7 días TTL)
 *   - `refreshToken` (rotativo, 30 días TTL) — see INTEGRATION.md for the
 *     mobile-specific deviation from the web's httpOnly-cookie scheme.
 *   - `userId`       (for fast hydration on cold start)
 */

const ACCESS_TOKEN_KEY = 'vetconnect.accessToken';
const REFRESH_TOKEN_KEY = 'vetconnect.refreshToken';
const USER_KEY = 'vetconnect.user';

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
    requireAuthentication: false,
  });
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  async setAccessToken(token: string): Promise<void> {
    await setItem(ACCESS_TOKEN_KEY, token);
  },
  async getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await setItem(REFRESH_TOKEN_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },
  async setUser(user: unknown): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async clearAll(): Promise<void> {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
      deleteItem(USER_KEY),
    ]);
  },
};
