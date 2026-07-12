import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme, spacing, radius, fontSizes, fontWeights, motion } from '@/theme';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta, children }: EmptyStateProps) {
  const { colors: c } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(50, withTiming(1, { duration: motion.duration.normal, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(50, withTiming(0, { duration: motion.duration.normal, easing: Easing.out(Easing.ease) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[{
        alignItems: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xxl,
        gap: spacing.lg,
      }, animStyle]}
      accessibilityRole="text"
      accessibilityLabel={title}
    >
      {icon && (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: radius.full,
            backgroundColor: c.primaryBg,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon} size={40} color={c.primary} />
        </View>
      )}
      <Text style={{ fontSize: fontSizes.subtitle, fontWeight: fontWeights.bold, color: c.ink, textAlign: 'center', letterSpacing: -0.3 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: fontSizes.body, color: c.inkMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>
          {subtitle}
        </Text>
      )}
      {ctaLabel && onCta && (
        <Button onPress={onCta} size="md" style={{ marginTop: spacing.sm }}>
          {ctaLabel}
        </Button>
      )}
      {children}
    </Animated.View>
  );
}
