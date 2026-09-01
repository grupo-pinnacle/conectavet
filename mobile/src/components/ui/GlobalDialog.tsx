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
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.dialog, { backgroundColor: c.surface }]}>
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
              pressed && { opacity: 0.8 }
            ]}
            onPress={() => {
              hide();
              config.onConfirm?.();
            }}
          >
            <Text style={styles.buttonText}>{config.confirmText || 'Entendido'}</Text>
          </Pressable>
        </View>
      </View>
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
