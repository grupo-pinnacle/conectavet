"use client";

interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

function getInitials(name?: string | null, alt?: string): string {
  const source = (name || alt || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({ src, alt, name, size = "md", className = "" }: AvatarProps) {
  const initials = getInitials(name, alt);
  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden bg-brand-soft text-brand font-semibold flex items-center justify-center flex-shrink-0 ${className}`}
      aria-label={alt}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}