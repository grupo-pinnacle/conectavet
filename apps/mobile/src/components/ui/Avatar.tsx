import { View, Text, Image } from "react-native";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  name,
  email,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const initials = getInitials(name, email);
  return (
    <View
      className={cn(
        "rounded-full overflow-hidden bg-brand-soft items-center justify-center",
        sizeClass[size],
        className
      )}
      accessibilityLabel={name || email || "Avatar"}
    >
      {src ? (
        <Image source={{ uri: src }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <Text className="font-semibold text-brand">{initials}</Text>
      )}
    </View>
  );
}