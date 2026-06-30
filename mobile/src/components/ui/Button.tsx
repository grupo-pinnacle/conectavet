import { ActivityIndicator, Pressable, Text, type PressableProps, type ViewStyle } from 'react-native';
import { colors } from '@/theme';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: '#fff' },
  secondary: { bg: colors.secondary, text: '#fff' },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.ink },
  danger: { bg: colors.danger, text: '#fff' },
};

const sizeStyles: Record<Size, { padding: string; fontSize: number }> = {
  sm: { padding: 'px-3 py-1.5', fontSize: 13 },
  md: { padding: 'px-4 py-2.5', fontSize: 15 },
  lg: { padding: 'px-6 py-3.5', fontSize: 16 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={[
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border ?? 'transparent',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading && <ActivityIndicator color={v.text} size="small" />}
      <Text
        style={{
          color: v.text,
          fontSize: s.fontSize,
          fontWeight: '600',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
