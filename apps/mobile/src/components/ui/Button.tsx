import { Pressable, Text } from "react-native";
import { ActivityIndicator, Pressable as RNPressable } from "react-native";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const variantClass: Record<Variant, string> = {
  primary: "bg-brand",
  secondary: "bg-surface",
  outline: "border border-brand bg-transparent",
  ghost: "bg-transparent",
};

const textVariantClass: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  outline: "text-brand",
  ghost: "text-brand",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-2",
  md: "px-4 py-3",
  lg: "px-6 py-4",
};

const textSizeClass: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className = "",
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`rounded-md items-center justify-center flex-row gap-2 ${variantClass[variant]} ${sizeClass[size]} ${isDisabled ? "opacity-50" : ""} ${className}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === "primary" || variant === "outline" ? "#1C60F0" : "#080808"} />}
      <Text className={`font-medium ${textVariantClass[variant]} ${textSizeClass[size]}`}>{children}</Text>
    </Pressable>
  );
}