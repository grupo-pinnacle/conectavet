import { View, Text, ViewProps, TextProps } from "react-native";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-brand-soft",
  success: "bg-green-100",
  warning: "bg-amber-100",
  danger: "bg-red-100",
  info: "bg-blue-100",
  neutral: "bg-gray-100",
};

const textVariantClass: Record<BadgeVariant, string> = {
  default: "text-brand",
  success: "text-green-800",
  warning: "text-amber-800",
  danger: "text-red-800",
  info: "text-blue-800",
  neutral: "text-gray-800",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: { children: React.ReactNode; variant?: BadgeVariant; className?: string } & ViewProps) {
  return (
    <View className={cn("self-start px-2 py-0.5 rounded-full", variantClass[variant], className)}>
      <Text className={cn("text-xs font-medium", textVariantClass[variant])}>{children}</Text>
    </View>
  );
}