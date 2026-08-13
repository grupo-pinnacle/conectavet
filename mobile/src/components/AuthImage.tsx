import { useEffect, useState } from 'react';
import { type ImageStyle } from 'react-native';
import { Image as ExpoImage, type ImageContentFit } from 'expo-image';
import { secureStorage } from '@/lib/secure-storage';
import { API_URL } from '@/lib/env';

interface AuthImageProps {
  uri: string;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  accessibilityLabel?: string;
}

const CONTENT_FIT: Record<NonNullable<AuthImageProps['resizeMode']>, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  repeat: 'cover',
  center: 'contain',
};

/**
 * Muestra una imagen protegida (/uploads/...) adjuntando el Bearer token.
 * Usa expo-image, que cachea en disco y decodifica fuera del hilo de JS:
 * evita el OOM y el bloqueo de UI que causaba el decode base64 en memoria
 * (crash en dispositivos de 2GB de RAM con varias fotos en el chat).
 */
export function AuthImage({ uri, style, resizeMode = 'cover', accessibilityLabel }: AuthImageProps) {
  const isExternal = uri.startsWith('http');
  const full = isExternal ? uri : `${API_URL}${uri}`;
  const [headers, setHeaders] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    let active = true;
    // Solo adjuntamos el Bearer a las imágenes propias del backend (/uploads).
    // Las URLs externas (p.ej. CDN) no lo necesitan ni deben recibir el token.
    if (isExternal) {
      setHeaders(undefined);
      return;
    }
    secureStorage
      .getAccessToken()
      .then((token) => {
        if (active) setHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
      })
      .catch(() => {
        if (active) setHeaders(undefined);
      });
    return () => {
      active = false;
    };
  }, [uri, isExternal]);

  return (
    <ExpoImage
      source={headers ? { uri: full, headers } : { uri: full }}
      style={style}
      contentFit={CONTENT_FIT[resizeMode]}
      cachePolicy="disk"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export default AuthImage;
