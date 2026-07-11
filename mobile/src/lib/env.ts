import { Platform } from 'react-native';

const MOBILE_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const MOBILE_WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3000/ws/queue';

export const API_URL = Platform.OS === 'web' ? 'http://localhost:3001' : MOBILE_API_URL;
export const WS_URL = Platform.OS === 'web' ? 'ws://localhost:3001/ws/queue' : MOBILE_WS_URL;
