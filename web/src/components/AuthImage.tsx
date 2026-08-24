import { useEffect, useState } from "react";
import api from "../services/api";

interface AuthImageProps {
  src: string;
  alt?: string;
  className?: string;
}

// Caché de sesión con tope (LRU simple): evita fugas revocando los blobs
// más viejos cuando pasamos MAX_CACHE.
const MAX_CACHE = 150;
const blobCache = new Map<string, string>();
// Single-flight: si dos componentes piden la misma imagen a la vez,
// se descarga una sola vez.
const inflight = new Map<string, Promise<string>>();

function touchCache(key: string, url: string) {
  blobCache.delete(key);
  blobCache.set(key, url);
  while (blobCache.size > MAX_CACHE) {
    const oldest = blobCache.keys().next().value as string | undefined;
    if (!oldest) break;
    const oldUrl = blobCache.get(oldest);
    blobCache.delete(oldest);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
  }
}

export default function AuthImage({ src, alt, className }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(() => blobCache.get(src) ?? null);
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Cambio de imagen dentro del mismo componente: ajustamos estado durante
  // el render (patrón de React) para mostrar ya lo cacheado si existe.
  if (prevSrc !== src) {
    setPrevSrc(src);
    setObjectUrl(blobCache.get(src) ?? null);
    setFailed(false);
  }

  useEffect(() => {
    let cancelled = false;

    const cached = blobCache.get(src);
    if (cached) {
      // Ya estaba en caché (el estado se ajustó arriba): solo refresca LRU.
      touchCache(src, cached);
      return () => {
        cancelled = true;
      };
    }

    let pending = inflight.get(src);
    if (!pending) {
      pending = api
        .get(src, { responseType: "blob" })
        .then((res) => {
          const url = URL.createObjectURL(res.data);
          touchCache(src, url);
          return url;
        })
        .finally(() => {
          inflight.delete(src);
        });
      inflight.set(src, pending);
    }
    pending
      .then((url) => {
        if (!cancelled) setObjectUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  // El archivo ya no existe (o no hay permiso): estado visible en vez de
  // un skeleton pulsando para siempre.
  if (failed) {
    return (
      <div
        className={`${className ?? ""} flex items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400`}
        role="img"
        aria-label={alt ? `${alt} (no disponible)` : "Imagen no disponible"}
      >
        Imagen no disponible
      </div>
    );
  }

  // Placeholder del mismo tamaño: sin saltos de layout mientras carga
  if (!objectUrl) {
    return <div className={`${className ?? ""} animate-pulse rounded-lg bg-slate-200`} role="img" aria-label={alt} />;
  }

  return <img src={objectUrl} alt={alt} className={`${className ?? ""} animate-[fadeIn_0.25s_ease-out]`} />;
}
