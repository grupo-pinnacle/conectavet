import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  children?: ReactNode;
}

export function EmptyState({ emoji = '🐾', title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 12 }}>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: colors.inkMuted, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      )}
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
