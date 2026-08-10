import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Host de desarrollo = la compu que sirvio el bundle de Metro.
 * En Expo Go es por ej. "192.168.0.8:8081" (WiFi) o "localhost:8081"
 * (USB con adb reverse). Asi la app apunta al mismo host que Metro,
 * sin depender de la IP fija del .env.
 */
function getDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  const withoutScheme = hostUri.includes('://') ? hostUri.split('://')[1] : hostUri;

  if (withoutScheme.startsWith('[')) {
    const end = withoutScheme.indexOf(']');
    return end > -1 ? withoutScheme.slice(1, end) : null;
  }

  const host = withoutScheme.split(':')[0];
  return host || null;
}

function isLocalHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

const devHost = getDevHost();

const MOBILE_API_URL =
  devHost && isLocalHost(devHost)
    ? `http://${devHost}:3001`
    : (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001');
const MOBILE_WS_URL =
  devHost && isLocalHost(devHost)
    ? `ws://${devHost}:3001`
    : (process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3001');

export const API_URL = Platform.OS === 'web' ? 'http://localhost:3001' : MOBILE_API_URL;
export const WS_URL = Platform.OS === 'web' ? 'ws://localhost:3001' : MOBILE_WS_URL;
