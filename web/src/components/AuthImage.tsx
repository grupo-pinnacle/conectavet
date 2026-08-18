import { useEffect, useState } from "react";
import api from "../services/api";

interface AuthImageProps {
  src: string;
  alt?: string;
  className?: string;
}

const blobCache = new Map<string, string>();

export default function AuthImage({ src, alt, className }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(() => blobCache.get(src) ?? null);

  useEffect(() => {
    const cached = blobCache.get(src);
    if (cached) {
      setObjectUrl(cached);
      return;
    }
    let revoked = false;
    api
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (revoked) return;
        const url = URL.createObjectURL(res.data);
        blobCache.set(src, url);
        setObjectUrl(url);
      })
      .catch(() => {});
    return () => {
      revoked = true;
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} loading="lazy" />;
}
