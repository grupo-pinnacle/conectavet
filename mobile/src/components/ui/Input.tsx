import { useCallback, useState } from 'react';
import { Platform, Text, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, spacing, radius, fontSizes, fontWeights, motion } from '@/theme';

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  success?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label, error, success, value, onChangeText, hint, leftIcon, disabled, containerStyle, ...rest
}: InputProps) {
  const { colors: c } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: motion.duration.fast, easing: Easing.out(Easing.ease) });
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: motion.duration.fast, easing: Easing.out(Easing.ease) });
  }, []);

  const borderAnimStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? c.danger
      : success && !focused
        ? c.success
        : focusProgress.value === 1
          ? c.primary
          : c.border,
    borderWidth: focused || error || success ? 2 : 1.5,
  }));

  const showError = error && !focused;
  const hasIcon = leftIcon || false;

  return (
    <View style={[{ marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: fontSizes.body,
            color: focused ? c.primary : c.ink,
            fontWeight: fontWeights.medium,
            marginBottom: spacing.xs,
            letterSpacing: 0.2,
          }}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: disabled ? c.borderLight : c.surface,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.lg,
            minHeight: 48,
            opacity: disabled ? 0.6 : 1,
          },
          borderAnimStyle,
        ]}
      >
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>
            <MaterialCommunityIcons
              name={leftIcon}
              size={20}
              color={focused ? c.primary : error ? c.danger : c.inkMuted}
            />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={c.inkMuted}
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityState={{ disabled: !!disabled }}
          style={{
            flex: 1,
            fontSize: fontSizes.input,
            color: c.ink,
            paddingVertical: spacing.md,
            minHeight: 24,
          }}
          {...rest}
        />
        {error && (
          <MaterialCommunityIcons name="alert-circle" size={18} color={c.danger} style={{ marginLeft: spacing.xs }} />
        )}
        {success && !error && value.length > 0 && (
          <MaterialCommunityIcons name="check-circle" size={18} color={c.success} style={{ marginLeft: spacing.xs }} />
        )}
      </Animated.View>
      {hint && !error && (
        <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, marginTop: spacing.xs, letterSpacing: 0.1 }}>
          {hint}
        </Text>
      )}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={c.danger} />
          <Text style={{ fontSize: fontSizes.label, color: c.danger, letterSpacing: 0.1, flex: 1 }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
