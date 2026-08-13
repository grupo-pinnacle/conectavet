import { useEffect, useState } from 'react';
import { Image, type ImageStyle } from 'react-native';
import { secureStorage } from '@/lib/secure-storage';
import { API_URL } from '@/lib/env';

interface AuthImageProps {
  uri: string;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  accessibilityLabel?: string;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += B64[b0 >> 2];
    result += B64[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < bytes.length ? B64[b2 & 63] : '=';
  }
  return result;
}

/**
 * Descarga una imagen protegida (/uploads/...) adjuntando el Bearer token
 * (el componente <Image> nativo no puede enviar headers ni la cookie de
 * auth), la convierte a data URI y la muestra. Evita el 401 que se veía en
 * el chat al enviar una foto.
 */
export function AuthImage({ uri, style, resizeMode = 'cover', accessibilityLabel }: AuthImageProps) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const full = uri.startsWith('http') ? uri : `${API_URL}${uri}`;
    (async () => {
      try {
        const token = await secureStorage.getAccessToken();
        const res = await fetch(full, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const mime = res.headers.get('content-type') || 'image/jpeg';
        if (active) {
          setDataUri(`data:${mime};base64,${bytesToBase64(new Uint8Array(buf))}`);
        }
      } catch {
        /* ignora: la imagen simplemente no se muestra */
      }
    })();
    return () => {
      active = false;
    };
  }, [uri]);

  if (!dataUri) return null;
  return <Image source={{ uri: dataUri }} style={style} resizeMode={resizeMode} accessibilityLabel={accessibilityLabel} />;
}

export default AuthImage;
