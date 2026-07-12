import { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, type GestureResponderEvent, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius, fontSizes, fontWeights, shadows, opacity, motion } from '@/theme';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'text';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

const sizeStyles: Record<Size, { height: number; px: number; fontSize: number; iconSize: number; gap: number }> = {
  sm: { height: 44, px: spacing.lg, fontSize: fontSizes.label, iconSize: 16, gap: spacing.sm },
  md: { height: 48, px: spacing.xl, fontSize: fontSizes.body, iconSize: 18, gap: spacing.sm },
  lg: { height: 56, px: spacing.xxl, fontSize: fontSizes.input, iconSize: 20, gap: spacing.md },
};

export function Button({
  variant = 'primary', size = 'md', loading = false, disabled = false, fullWidth = true,
  icon, children, style, haptic = true, onPress, onPressIn, onPressOut, ...rest
}: ButtonProps) {
  const { colors: c } = useTheme();
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const variantStyle = {
    primary: { bg: c.primary, text: c.white, border: 'transparent', pressedBg: c.primaryDark },
    secondary: { bg: c.secondary, text: c.white, border: 'transparent', pressedBg: c.secondaryDark },
    outline: { bg: 'transparent', text: c.primary, border: c.border, pressedBg: c.primaryBg },
    ghost: { bg: 'transparent', text: c.ink, border: 'transparent', pressedBg: c.borderLight },
    danger: { bg: c.danger, text: c.white, border: 'transparent', pressedBg: c.dangerDark },
    text: { bg: 'transparent', text: c.primary, border: 'transparent', pressedBg: 'transparent' },
  }[variant];

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    scale.value = withSpring(0.97, motion.springSnappy);
    if (haptic && !isDisabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressIn?.(e);
  }, [haptic, isDisabled, onPressIn]);

  const handlePressOut = useCallback((e: GestureResponderEvent) => {
    scale.value = withSpring(1, motion.springSnappy);
    onPressOut?.(e);
  }, [onPressOut]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, fullWidth && { alignSelf: 'stretch' }]}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        accessibilityHint={loading ? 'Cargando, por favor esperá' : undefined}
        style={{
          backgroundColor: variantStyle.bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variantStyle.border,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: s.gap,
          height: s.height,
          paddingHorizontal: s.px,
          opacity: isDisabled ? opacity.disabled : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          minWidth: size === 'sm' ? 80 : 120,
          ...shadows.subtle,
        }}
        {...rest}
      >
        {loading && <ActivityIndicator color={variantStyle.text} size="small" />}
        {!loading && icon}
        <Text
          style={{
            color: variantStyle.text,
            fontSize: s.fontSize,
            fontWeight: fontWeights.semibold,
            letterSpacing: 0.15,
          }}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
