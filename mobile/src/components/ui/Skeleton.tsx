import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { useTheme, radius, spacing, motion } from '@/theme';

function useShimmerReanimated() {
  const { isReducedMotion } = useTheme();
  const opacity = useSharedValue(isReducedMotion ? 0.5 : 0.3);

  useEffect(() => {
    if (isReducedMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.duration.slow, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: motion.duration.slow, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [isReducedMotion]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function Skeleton({ width = '100%' as DimensionValue, height = 16, radius: r = radius.md }: {
  width?: DimensionValue; height?: number; radius?: number;
}) {
  const { colors: c } = useTheme();
  const animStyle = useShimmerReanimated();

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(100)}
      style={[{
        width,
        height,
        backgroundColor: c.borderLight,
        borderRadius: r,
      }, animStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
    />
  );
}

export function SkeletonCard() {
  const { colors: c, isReducedMotion } = useTheme();
  const entering = isReducedMotion ? undefined : FadeIn.duration(200);

  return (
    <Animated.View
      entering={entering}
      style={{
        backgroundColor: c.surface,
        borderRadius: radius.xl,
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: c.borderLight,
      }}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando contenido"
    >
      <Skeleton width="45%" height={18} />
      <Skeleton width="85%" height={14} />
      <Skeleton width="55%" height={14} />
    </Animated.View>
  );
}
