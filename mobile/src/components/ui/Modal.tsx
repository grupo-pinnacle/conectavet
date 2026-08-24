import { useCallback, useEffect } from 'react';
import { Modal as RNModal, Pressable, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, radius, spacing, fontSizes, fontWeights, shadows, motion } from '@/theme';
import type { ReactNode } from 'react';

interface ModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ visible, title, onClose, children, footer }: ModalProps) {
  const { colors: c } = useTheme();
  const overlayOpacity = useSharedValue(0);
  const slideTranslate = useSharedValue(300);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: motion.duration.fast, easing: Easing.out(Easing.ease) });
      slideTranslate.value = withSpring(0, motion.spring);
    } else {
      overlayOpacity.value = withTiming(0, { duration: motion.duration.fast });
      slideTranslate.value = 300;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideTranslate.value }] }));

  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: motion.duration.fast });
    slideTranslate.value = withSpring(300, { damping: 20, stiffness: 200 });
    setTimeout(onClose, 150);
  }, [onClose]);

  return (
    <RNModal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }, overlayStyle]}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} accessibilityLabel="Cerrar" accessibilityRole="button" />
          <Animated.View
            style={[
              {
                backgroundColor: c.surface,
                borderTopLeftRadius: radius.xxl,
                borderTopRightRadius: radius.xxl,
                paddingTop: spacing.xxl,
                paddingHorizontal: spacing.xxl,
                paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xxl,
                ...shadows.modal,
              },
              sheetStyle,
            ]}
            accessibilityLabel={title ?? 'Diálogo'}
          >
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: c.border,
                borderRadius: radius.full,
                alignSelf: 'center',
                marginBottom: spacing.xl,
              }}
            />
            {title && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <Text style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: c.ink, letterSpacing: -0.3 }}>
                  {title}
                </Text>
                <Pressable onPress={handleClose} accessibilityLabel="Cerrar" accessibilityRole="button" hitSlop={12}>
                  <MaterialCommunityIcons name="close" size={24} color={c.inkMuted} />
                </Pressable>
              </View>
            )}
            <View style={{ marginBottom: footer ? spacing.xxl : 0 }}>{children}</View>
            {footer && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  justifyContent: 'flex-end',
                  paddingTop: spacing.lg,
                  borderTopWidth: 1,
                  borderTopColor: c.borderLight,
                }}
              >
                {footer}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
