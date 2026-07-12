import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme, spacing, radius, fontSizes, fontWeights, shadows, motion } from '@/theme';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  showFlaggedBanner?: boolean;
}

export function ChatBubble({ message, showFlaggedBanner = true }: ChatBubbleProps) {
  const { colors: c } = useTheme();
  const isUser = message.role === 'USER';
  const isAssistant = message.role === 'ASSISTANT';

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(30, withTiming(1, { duration: motion.duration.fast }));
    translateY.value = withDelay(30, withTiming(0, { duration: motion.duration.fast }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (message.role === 'SYSTEM') {
    return (
      <View style={{ alignItems: 'center', marginVertical: spacing.sm }} accessibilityRole="text" accessibilityLabel={`Mensaje del sistema: ${message.content}`}>
        <View style={{ backgroundColor: c.borderLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full }}>
          <Text style={{ fontSize: fontSizes.label, color: c.inkMuted, fontStyle: 'italic' }}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[{ marginVertical: spacing.xs, alignItems: isUser ? 'flex-end' : 'flex-start' }, animStyle]}>
      {isAssistant && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs, marginLeft: spacing.xs }}>
          <View style={{ width: 20, height: 20, borderRadius: radius.full, backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcons name="robot" size={12} color={c.primary} />
          </View>
          <Text style={{ fontSize: fontSizes.caption, color: c.inkMuted, fontWeight: fontWeights.semibold }}>
            Asistente VetConnect
          </Text>
        </View>
      )}
      <View
        style={{
          maxWidth: '82%',
          backgroundColor: isUser ? c.primary : c.surface,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.xl,
          borderBottomRightRadius: isUser ? radius.xs : radius.xl,
          borderBottomLeftRadius: isUser ? radius.xl : radius.xs,
          borderWidth: isUser ? 0 : 1,
          borderColor: c.border,
          ...(isUser ? {} : shadows.subtle),
        }}
        accessibilityRole="text"
        accessibilityLabel={`${isUser ? 'Vos' : 'Asistente'}: ${message.content}`}
      >
        <Text
          style={{
            color: isUser ? c.white : c.ink,
            fontSize: fontSizes.body,
            lineHeight: 20,
            letterSpacing: 0.1,
          }}
        >
          {message.content}
        </Text>
      </View>
      {showFlaggedBanner && message.flagged && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs, marginHorizontal: spacing.xs }}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={c.danger} />
          <Text style={{ fontSize: fontSizes.caption, color: c.danger, fontWeight: fontWeights.medium }}>
            Mensaje marcado por seguridad
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
