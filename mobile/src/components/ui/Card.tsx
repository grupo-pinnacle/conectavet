import { useCallback } from 'react';
import { Pressable, View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, radius, spacing, shadows, motion } from '@/theme';
import type { ReactNode } from 'react';

type CardVariant = 'elevated' | 'outlined' | 'ghost';

interface CardProps extends ViewProps {
  padding?: number;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  pressable?: boolean;
  onPress?: () => void;
}

export function Card({
  padding = spacing.lg, variant = 'elevated', style, children, pressable, onPress, ...rest
}: CardProps) {
  const { colors: c } = useTheme();
  const scale = useSharedValue(1);

  const v = {
    elevated: { bg: c.surface, shadow: shadows.raised, borderColor: 'transparent', borderWidth: 0 },
    outlined: { bg: c.surface, shadow: shadows.none, borderColor: c.border, borderWidth: 1 },
    ghost: { bg: 'transparent', shadow: shadows.none, borderColor: 'transparent', borderWidth: 0 },
  }[variant];

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, motion.springSnappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, motion.springSnappy);
  }, []);

  const content = (
    <Animated.View style={animStyle}>
      <View
        style={[
          {
            backgroundColor: v.bg,
            borderRadius: radius.xl,
            padding,
            borderWidth: v.borderWidth,
            borderColor: v.borderColor,
            ...v.shadow,
          },
          style,
        ]}
        accessibilityRole={pressable ? 'button' : undefined}
        {...rest}
      >
        {children}
      </View>
    </Animated.View>
  );

  if (pressable) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
