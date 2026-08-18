import * as Linking from 'expo-linking';

/**
 * Abre un deep link (`vetconnect://...`) y, si no hay app registrada que lo
 * maneje, cae back al equivalente en navegador web (M-04: graceful degradation
 * para llamadas y otros deep links).
 */
export async function openWithFallback(deepLink: string, webFallback: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(deepLink);
    if (canOpen) {
      await Linking.openURL(deepLink);
      return true;
    }
  } catch {
    // ignora y prueba el fallback
  }
  try {
    await Linking.openURL(webFallback);
    return false;
  } catch {
    return false;
  }
}

export function callDeepLink(consultationId: string): string {
  return `vetconnect://call/${consultationId}`;
}

export function callWebFallback(consultationId: string): string {
  const base = process.env.EXPO_PUBLIC_WEB_URL || 'https://app.conectavet.com';
  return `${base}/call/${consultationId}`;
}
