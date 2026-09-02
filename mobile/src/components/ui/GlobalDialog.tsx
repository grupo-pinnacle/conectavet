import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useDialogStore } from '@/stores/dialogStore';
import { useTheme, spacing, radius, fontSizes, fontWeights } from '@/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function GlobalDialog() {
  const { isVisible, config, hide } = useDialogStore();
  const { colors: c } = useTheme();

  if (!config) return null;

  const getIcon = () => {
    switch (config.type) {
      case 'error': return { name: 'alert-circle', color: '#EF4444' } as const;
      case 'success': return { name: 'check-circle', color: '#10B981' } as const;
      default: return { name: 'information', color: c.primary } as const;
    }
  };

  const icon = getIcon();

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={hide}
    >
      <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={hide}>
        <Pressable style={[styles.dialog, { backgroundColor: c.surface }]} onPress={(e) => e.stopPropagation()}>
          <Pressable
            onPress={hide}
            style={{ position: 'absolute', top: 16, right: 16, padding: 6, zIndex: 10 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar diálogo"
          >
            <MaterialCommunityIcons name="close" size={20} color={c.inkMuted} />
          </Pressable>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon.name} size={48} color={icon.color} />
          </View>
          
          <Text style={[styles.title, { color: c.ink }]}>{config.title}</Text>
          
          {config.message ? (
            <Text style={[styles.message, { color: c.inkMuted }]}>{config.message}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: c.primary },
              pressed && { opacity: 0.85 }
            ]}
            onPress={() => {
              hide();
              config.onConfirm?.();
            }}
          >
            <Text style={styles.buttonText}>{config.confirmText || 'Continuar'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
