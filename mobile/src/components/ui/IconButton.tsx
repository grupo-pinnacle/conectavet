import { useCallback } from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, radius, spacing, opacity } from '@/theme';

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  bg?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export function IconButton({
  icon, size = 24, color, bg, disabled = false, style,
  haptic = true, accessibilityLabel, accessibilityHint,
  onPress, onPressIn, onPressOut, ...rest
}: IconButtonProps) {
  const { colors: c } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback((e: any) => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 350, mass: 0.5 });
    if (haptic && !disabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressIn?.(e);
  }, [haptic, disabled, onPressIn]);

  const handlePressOut = useCallback((e: any) => {
    scale.value = withSpring(1, { damping: 12, stiffness: 350, mass: 0.5 });
    onPressOut?.(e);
  }, [onPressOut]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[
          {
            width: size + spacing.lg,
            height: size + spacing.lg,
            borderRadius: radius.full,
            backgroundColor: bg ?? 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: disabled ? opacity.disabled : 1,
          },
          style,
        ]}
        {...rest}
      >
        <MaterialCommunityIcons name={icon} size={size} color={color ?? c.ink} />
      </Pressable>
    </Animated.View>
  );
}
