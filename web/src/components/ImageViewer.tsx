import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import AuthImage from "./AuthImage";

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        // Cerrar solo al tocar el fondo, no al tocar la imagen (P3-14).
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen en tamaño completo"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Cerrar imagen"
      >
        <X className="h-5 w-5" />
      </button>
      <AuthImage
        src={src}
        alt={alt || "Imagen adjunta"}
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
      />
    </div>
  );
}
