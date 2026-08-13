import { useEffect, useState } from "react";
import api from "../services/api";

interface AuthImageProps {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * Carga imágenes subidas (/uploads/...) con el token de acceso, ya que el
 * recurso está protegido y un <img> directo no puede enviar la cookie/auth
 * cross-origin (lo que daba 401). Usamos el cliente api (que adjunta Bearer)
 * y mostramos un object URL.
 */
export default function AuthImage({ src, alt, className }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    api
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (revoked) return;
        url = URL.createObjectURL(res.data);
        setObjectUrl(url);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}
