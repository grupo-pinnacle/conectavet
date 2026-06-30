import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { ReactNode } from 'react';

interface ModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ visible, title, onClose, children, footer }: ModalProps) {
  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 360,
          }}
        >
          {title && (
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 }}>
              {title}
            </Text>
          )}
          <View style={{ marginBottom: 16 }}>{children}</View>
          {footer && <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
